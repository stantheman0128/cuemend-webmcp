import test from "node:test";
import assert from "node:assert/strict";

import { createCueMendStore } from "../src/commands.js";
import {
  attachCueMendWebMcp,
  getCueMendToolDefinitions,
} from "../src/webmcp.js";

function names(store) {
  return getCueMendToolDefinitions(store).map((tool) => tool.name);
}

function parseToolResult(result) {
  return JSON.parse(result.content[0].text);
}

test("tool inventory follows baseline, proposal, approved, stale, and committed phases", async () => {
  const store = createCueMendStore();
  assert.deepEqual(names(store), [
    "cuemend_get_rehearsal",
    "cuemend_audit_captions",
    "cuemend_stage_timing_plan",
  ]);
  const staged = await store.dispatch(
    "stageTimingPlan",
    { expectedRevision: 1 },
    "AGENT",
  );
  assert.deepEqual(names(store), [
    "cuemend_get_rehearsal",
    "cuemend_audit_captions",
    "cuemend_stage_timing_plan",
    "cuemend_preview_timing_plan",
    "cuemend_discard_timing_plan",
  ]);
  await store.dispatch(
    "toggleBeatLock",
    { beatId: "beat-breath", expectedRevision: 1 },
    "HUMAN",
  );
  assert.deepEqual(names(store), [
    "cuemend_get_rehearsal",
    "cuemend_audit_captions",
    "cuemend_stage_timing_plan",
    "cuemend_discard_timing_plan",
  ]);
  const restaged = await store.dispatch(
    "stageTimingPlan",
    { expectedRevision: 2 },
    "AGENT",
  );
  const planId = restaged.proposal.plans[0].id;
  await store.dispatch(
    "selectPlan",
    { proposalId: restaged.proposal.id, planId },
    "HUMAN",
  );
  await store.dispatch(
    "approveSelectedPlan",
    { proposalId: restaged.proposal.id },
    "HUMAN",
  );
  assert.ok(names(store).includes("cuemend_commit_approved_plan"));
  await store.dispatch(
    "commitApprovedPlan",
    { requestId: "inventory-001" },
    "AGENT",
  );
  assert.deepEqual(names(store), [
    "cuemend_get_rehearsal",
    "cuemend_audit_captions",
    "cuemend_verify_and_export",
  ]);
  assert.notEqual(staged.proposal.id, restaged.proposal.id);
});

test("tool handlers reject unknown arguments and aborted execution", async () => {
  const store = createCueMendStore();
  const tools = getCueMendToolDefinitions(store);
  const audit = tools.find((tool) => tool.name === "cuemend_audit_captions");
  const invalid = await audit.execute({ surprise: true });
  assert.equal(invalid.isError, true);
  assert.equal(parseToolResult(invalid).error.code, "UNKNOWN_ARGUMENT");
  const controller = new AbortController();
  controller.abort();
  const aborted = await audit.execute({}, { signal: controller.signal });
  assert.equal(aborted.isError, true);
  assert.equal(parseToolResult(aborted).error.code, "ABORTED");
});

test("WebMCP preview is visible in shared state but leaves active cues untouched", async () => {
  const store = createCueMendStore();
  const activeBefore = store.getSnapshot().cues;
  const staged = await store.dispatch(
    "stageTimingPlan",
    { expectedRevision: 1 },
    "AGENT",
  );
  const previewTool = getCueMendToolDefinitions(store).find(
    (tool) => tool.name === "cuemend_preview_timing_plan",
  );
  assert.equal(previewTool.annotations.readOnlyHint, false);
  const result = await previewTool.execute({
    proposalId: staged.proposal.id,
    planId: staged.proposal.plans[0].id,
  });
  assert.equal(parseToolResult(result).ok, true);
  assert.equal(store.getSnapshot().preview.actor, "AGENT");
  assert.deepEqual(store.getSnapshot().cues, activeBefore);
});

test("adapter registers current tools and aborts old inventory on phase change", async () => {
  const store = createCueMendStore();
  const registrations = [];
  const fakeDocument = {
    modelContext: {
      async registerTool(tool, options) {
        registrations.push({ tool, signal: options.signal });
      },
    },
  };
  const inventories = [];
  const adapter = await attachCueMendWebMcp({
    store,
    documentRef: fakeDocument,
    onInventory: (inventory) => inventories.push(inventory),
    lateInjectionAttempts: 0,
    lateInjectionDelayMs: 0,
  });
  await adapter.ready;
  assert.equal(adapter.supported, true);
  assert.equal(registrations.length, 3);
  const firstSignal = registrations[0].signal;
  await store.dispatch("stageTimingPlan", { expectedRevision: 1 }, "AGENT");
  await adapter.ready;
  assert.equal(firstSignal.aborted, true);
  assert.equal(registrations.length, 8);
  assert.ok(
    inventories.at(-1).names.includes("cuemend_preview_timing_plan"),
  );
  const latestSignal = registrations.at(-1).signal;
  adapter.stop();
  assert.equal(latestSignal.aborted, true);
});

test("adapter degrades cleanly when WebMCP is unavailable", async () => {
  const store = createCueMendStore();
  let inventory;
  const adapter = await attachCueMendWebMcp({
    store,
    documentRef: {},
    onInventory: (value) => {
      inventory = value;
    },
    lateInjectionAttempts: 0,
    lateInjectionDelayMs: 0,
  });
  assert.equal(adapter.supported, false);
  assert.equal(inventory.supported, false);
  assert.deepEqual(inventory.names, []);
});

test("adapter aborts a partial failed inventory and retries on the next state event", async () => {
  const store = createCueMendStore();
  const attempts = [];
  let failOnce = true;
  const fakeDocument = {
    modelContext: {
      async registerTool(tool, options) {
        attempts.push({ name: tool.name, signal: options.signal });
        if (failOnce && tool.name === "cuemend_audit_captions") {
          failOnce = false;
          throw new Error("transient registration failure");
        }
      },
    },
  };
  const inventories = [];
  const adapter = await attachCueMendWebMcp({
    store,
    documentRef: fakeDocument,
    onInventory: (inventory) => inventories.push(inventory),
    lateInjectionAttempts: 0,
    lateInjectionDelayMs: 0,
  });
  await adapter.ready;
  assert.match(inventories.at(-1).error, /transient registration failure/);
  assert.ok(attempts.slice(0, 3).every((attempt) => attempt.signal.aborted));

  await store.dispatch("auditCaptions", {}, "HUMAN");
  await adapter.ready;
  assert.deepEqual(inventories.at(-1).names, [
    "cuemend_get_rehearsal",
    "cuemend_audit_captions",
    "cuemend_stage_timing_plan",
  ]);
  adapter.stop();
});
