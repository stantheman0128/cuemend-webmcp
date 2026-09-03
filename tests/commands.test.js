import test from "node:test";
import assert from "node:assert/strict";

import {
  createCueMendStore,
  CueMendError,
  snapshotFingerprint,
} from "../src/commands.js";

async function expectCode(promise, code) {
  await assert.rejects(promise, (error) => {
    assert.ok(error instanceof CueMendError);
    assert.equal(error.code, code);
    return true;
  });
}

test("human lock invalidates a proposal and stale preview fails closed", async () => {
  const store = createCueMendStore();
  const staged = await store.dispatch(
    "stageTimingPlan",
    { expectedRevision: 1 },
    "AGENT",
  );
  const planId = staged.proposal.plans[0].id;
  await store.dispatch(
    "toggleBeatLock",
    { beatId: "beat-breath", expectedRevision: 1 },
    "HUMAN",
  );
  const snapshot = store.getSnapshot();
  assert.equal(snapshot.workspaceRevision, 2);
  assert.equal(snapshot.phase, "stale");
  assert.equal(snapshot.audit.issueCount, 8);
  await expectCode(
    store.dispatch(
      "previewTimingPlan",
      { proposalId: staged.proposal.id, planId },
      "AGENT",
    ),
    "STALE_REVISION",
  );
});

test("agent preview updates shared view state without changing active captions", async () => {
  const store = createCueMendStore();
  const before = store.getSnapshot().cues;
  const staged = await store.dispatch(
    "stageTimingPlan",
    { expectedRevision: 1 },
    "AGENT",
  );
  const planId = staged.proposal.plans[0].id;
  const preview = await store.dispatch(
    "previewTimingPlan",
    { proposalId: staged.proposal.id, planId },
    "AGENT",
  );
  const snapshot = store.getSnapshot();
  assert.equal(preview.ok, true);
  assert.deepEqual(snapshot.cues, before);
  assert.deepEqual(snapshot.preview, {
    serial: 1,
    proposalId: staged.proposal.id,
    planId,
    workspaceRevision: 1,
    actor: "AGENT",
  });
});

test("agent cannot change artistic locks or approve a plan", async () => {
  const store = createCueMendStore();
  await expectCode(
    store.dispatch(
      "toggleBeatLock",
      { beatId: "beat-breath", expectedRevision: 1 },
      "AGENT",
    ),
    "HUMAN_AUTHORITY_REQUIRED",
  );
  const staged = await store.dispatch(
    "stageTimingPlan",
    { expectedRevision: 1 },
    "AGENT",
  );
  await expectCode(
    store.dispatch(
      "selectPlan",
      { proposalId: staged.proposal.id, planId: staged.proposal.plans[0].id },
      "AGENT",
    ),
    "HUMAN_AUTHORITY_REQUIRED",
  );
});

test("commit requires exact human approval and is idempotent", async () => {
  const store = createCueMendStore();
  await store.dispatch(
    "toggleBeatLock",
    { beatId: "beat-breath", expectedRevision: 1 },
    "HUMAN",
  );
  const staged = await store.dispatch(
    "stageTimingPlan",
    { expectedRevision: 2 },
    "AGENT",
  );
  const planId = staged.proposal.plans[0].id;
  const proposalId = staged.proposal.id;
  await expectCode(
    store.dispatch(
      "commitApprovedPlan",
      { requestId: "demo-run-001" },
      "AGENT",
    ),
    "HUMAN_APPROVAL_REQUIRED",
  );
  await store.dispatch("selectPlan", { proposalId, planId }, "HUMAN");
  await store.dispatch("approveSelectedPlan", { proposalId }, "HUMAN");
  const beforeCommit = store.getSnapshot();
  assert.equal(beforeCommit.phase, "approved");
  const first = await store.dispatch(
    "commitApprovedPlan",
    { requestId: "demo-run-001" },
    "AGENT",
  );
  assert.equal(first.idempotentReplay, false);
  assert.equal(first.receipt.beforeIssueCount, 8);
  assert.equal(first.receipt.afterIssueCount, 0);
  assert.equal(first.receipt.workspaceRevision, 3);
  const fingerprint = snapshotFingerprint(store.getSnapshot());
  const replay = await store.dispatch(
    "commitApprovedPlan",
    { requestId: "demo-run-001" },
    "AGENT",
  );
  assert.equal(replay.idempotentReplay, true);
  assert.deepEqual(replay.receipt, first.receipt);
  assert.equal(snapshotFingerprint(store.getSnapshot()), fingerprint);
});

test("verification emits clean VTT and a SHA-256-bound limitations certificate", async () => {
  const store = createCueMendStore();
  await store.dispatch(
    "toggleBeatLock",
    { beatId: "beat-breath", expectedRevision: 1 },
    "HUMAN",
  );
  const staged = await store.dispatch(
    "stageTimingPlan",
    { expectedRevision: 2 },
    "AGENT",
  );
  const proposalId = staged.proposal.id;
  const planId = staged.proposal.plans[0].id;
  await store.dispatch("selectPlan", { proposalId, planId }, "HUMAN");
  await store.dispatch("approveSelectedPlan", { proposalId }, "HUMAN");
  await store.dispatch(
    "commitApprovedPlan",
    { requestId: "verify-run-001" },
    "AGENT",
  );
  const verified = await store.dispatch("verifyAndExport", {}, "AGENT");
  assert.equal(verified.ok, true);
  assert.equal(verified.audit.issueCount, 0);
  assert.match(verified.vtt, /^WEBVTT/);
  assert.match(verified.vttDigest, /^[a-f0-9]{64}$/);
  assert.match(verified.certificate.digest, /^[a-f0-9]{64}$/);
  assert.equal(verified.certificate.limitations.length, 3);
});

test("committed state retires proposal mutations while preserving exact replay", async () => {
  const store = createCueMendStore();
  const staged = await store.dispatch(
    "stageTimingPlan",
    { expectedRevision: 1 },
    "AGENT",
  );
  const proposalId = staged.proposal.id;
  const planId = staged.proposal.plans[0].id;
  await store.dispatch("selectPlan", { proposalId, planId }, "HUMAN");
  await store.dispatch("approveSelectedPlan", { proposalId }, "HUMAN");
  const first = await store.dispatch(
    "commitApprovedPlan",
    { requestId: "immutable-commit-001" },
    "AGENT",
  );
  const committed = snapshotFingerprint(store.getSnapshot());

  for (const attempt of [
    store.dispatch("stageTimingPlan", { expectedRevision: 2 }, "AGENT"),
    store.dispatch("discardTimingPlan", { proposalId }, "AGENT"),
    store.dispatch("selectPlan", { proposalId, planId }, "HUMAN"),
    store.dispatch("approveSelectedPlan", { proposalId }, "HUMAN"),
    store.dispatch(
      "toggleBeatLock",
      { beatId: "beat-breath", expectedRevision: 2 },
      "HUMAN",
    ),
  ]) {
    await expectCode(attempt, "INVALID_PHASE");
  }

  const replay = await store.dispatch(
    "commitApprovedPlan",
    { requestId: "immutable-commit-001" },
    "AGENT",
  );
  assert.equal(replay.idempotentReplay, true);
  assert.deepEqual(replay.receipt, first.receipt);
  assert.equal(snapshotFingerprint(store.getSnapshot()), committed);
});
