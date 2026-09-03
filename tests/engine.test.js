import test from "node:test";
import assert from "node:assert/strict";

import { createInitialWorkspace } from "../src/fixture.js";
import {
  auditTrack,
  exportWebVtt,
  searchTimingPlans,
  sha256Hex,
  stableStringify,
} from "../src/engine.js";

function audit(workspace, cues = workspace.cues) {
  return auditTrack({
    cues,
    beats: workspace.beats,
    profile: workspace.profile,
    reservedRegions: workspace.reservedRegions,
  });
}

test("fixture starts with exactly the seven intended conflict types", () => {
  const workspace = createInitialWorkspace();
  const result = audit(workspace);
  assert.equal(result.issueCount, 7);
  assert.deepEqual(
    [...new Set(result.issues.map((issue) => issue.type))].sort(),
    [
      "cue_overlap",
      "cue_too_short",
      "protected_beat",
      "reading_rate",
      "reserved_region",
      "speaker_missing",
    ],
  );
  assert.equal(
    result.issues.filter((issue) => issue.type === "protected_beat").length,
    2,
  );
  assert.equal(result.metrics.protectedBeatCount, 2);
});

test("bounded search evaluates 3^8 tracks and returns zero-conflict plans", () => {
  const workspace = createInitialWorkspace();
  const search = searchTimingPlans({
    cues: workspace.cues,
    beats: workspace.beats,
    profile: workspace.profile,
    reservedRegions: workspace.reservedRegions,
  });
  assert.equal(search.evaluatedCount, 6_561);
  assert.ok(search.feasibleCount > 0);
  assert.equal(search.plans.length, 3);
  for (const plan of search.plans) {
    assert.equal(plan.audit.issueCount, 0);
  }
  assert.equal(search.plans[0].variantIds["cue-08"], "original");
});

test("protecting the optional breath adds one issue and forces cue 08 to move", () => {
  const workspace = createInitialWorkspace();
  workspace.beats.find((beat) => beat.id === "beat-breath").locked = true;
  assert.equal(audit(workspace).issueCount, 8);
  const search = searchTimingPlans({
    cues: workspace.cues,
    beats: workspace.beats,
    profile: workspace.profile,
    reservedRegions: workspace.reservedRegions,
  });
  assert.equal(search.evaluatedCount, 6_561);
  assert.ok(search.feasibleCount > 0);
  assert.notEqual(search.plans[0].variantIds["cue-08"], "original");
  assert.equal(search.plans[0].audit.issueCount, 0);
});

test("solver never rewrites cue text or beat definitions", () => {
  const workspace = createInitialWorkspace();
  workspace.beats.find((beat) => beat.id === "beat-breath").locked = true;
  const originalText = workspace.cues.map(({ id, text }) => ({ id, text }));
  const originalBeats = stableStringify(workspace.beats);
  const search = searchTimingPlans({
    cues: workspace.cues,
    beats: workspace.beats,
    profile: workspace.profile,
    reservedRegions: workspace.reservedRegions,
  });
  assert.deepEqual(
    search.plans[0].cues.map(({ id, text }) => ({ id, text })),
    originalText,
  );
  assert.equal(stableStringify(workspace.beats), originalBeats);
});

test("WebVTT export is ordered, editable, and digestible", async () => {
  const workspace = createInitialWorkspace();
  workspace.beats.find((beat) => beat.id === "beat-breath").locked = true;
  const plan = searchTimingPlans({
    cues: workspace.cues,
    beats: workspace.beats,
    profile: workspace.profile,
    reservedRegions: workspace.reservedRegions,
  }).plans[0];
  const vtt = exportWebVtt(plan.cues, workspace.profile);
  assert.match(vtt, /^WEBVTT\n\nNOTE CueMend Demo Theatre Profile v1/);
  assert.match(vtt, /00:00:00\.600 --> 00:00:03\.200/);
  assert.match(vtt, /<v MARA>When the lights die, count to four\./);
  assert.match(vtt, /line:90% position:10% align:start/);
  assert.equal((vtt.match(/\n\d+\n/g) ?? []).length, 10);
  assert.match(await sha256Hex(vtt), /^[a-f0-9]{64}$/);
});
