import {
  CUE_VARIANTS,
  DEMO_PROFILE,
  RESERVED_REGIONS,
} from "./fixture.js";

const EPSILON = 1e-9;

export function stableStringify(value) {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  const keys = Object.keys(value).sort();
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
}

export async function sha256Hex(value) {
  if (!globalThis.crypto?.subtle) {
    throw new Error("SHA-256 requires Web Crypto in a secure context.");
  }
  const source = typeof value === "string" ? value : stableStringify(value);
  const bytes = new TextEncoder().encode(source);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function intervalsOverlap(aStart, aEnd, bStart, bEnd) {
  return Math.min(aEnd, bEnd) - Math.max(aStart, bStart) > EPSILON;
}

export function countReadableCharacters(text) {
  return String(text).replace(/\s+/g, " ").trim().length;
}

function issue(id, type, cueIds, message, details = {}) {
  return { id, type, severity: "error", cueIds, message, ...details };
}

export function auditTrack({
  cues,
  beats,
  profile = DEMO_PROFILE,
  reservedRegions = RESERVED_REGIONS,
}) {
  const sorted = [...cues].sort(
    (left, right) => left.start - right.start || left.id.localeCompare(right.id),
  );
  const issues = [];

  for (let index = 0; index < sorted.length - 1; index += 1) {
    const current = sorted[index];
    const next = sorted[index + 1];
    if (intervalsOverlap(current.start, current.end, next.start, next.end)) {
      issues.push(
        issue(
          `overlap:${current.id}:${next.id}`,
          "cue_overlap",
          [current.id, next.id],
          `${current.id} overlaps ${next.id} by ${(
            Math.min(current.end, next.end) - Math.max(current.start, next.start)
          ).toFixed(2)}s.`,
        ),
      );
    } else {
      const gap = next.start - current.end;
      if (gap + EPSILON < profile.minGapSeconds) {
        issues.push(
          issue(
            `gap:${current.id}:${next.id}`,
            "cue_gap",
            [current.id, next.id],
            `${current.id} leaves only ${gap.toFixed(2)}s before ${next.id}.`,
          ),
        );
      }
    }
  }

  for (const cue of sorted) {
    const duration = cue.end - cue.start;
    const characters = countReadableCharacters(cue.text);
    const cps = characters / duration;

    if (duration + EPSILON < profile.minCueDurationSeconds) {
      issues.push(
        issue(
          `duration:${cue.id}`,
          "cue_too_short",
          [cue.id],
          `${cue.id} lasts ${duration.toFixed(2)}s; the profile minimum is ${profile.minCueDurationSeconds.toFixed(2)}s.`,
          { measured: duration, limit: profile.minCueDurationSeconds },
        ),
      );
    }

    if (cps - EPSILON > profile.maxCharactersPerSecond) {
      issues.push(
        issue(
          `rate:${cue.id}`,
          "reading_rate",
          [cue.id],
          `${cue.id} runs at ${cps.toFixed(1)} characters/s; the profile maximum is ${profile.maxCharactersPerSecond}.`,
          { measured: cps, limit: profile.maxCharactersPerSecond },
        ),
      );
    }

    if (!String(cue.speaker).trim()) {
      issues.push(
        issue(
          `speaker:${cue.id}`,
          "speaker_missing",
          [cue.id],
          `${cue.id} has dialogue but no speaker label.`,
        ),
      );
    }

    for (const beat of beats.filter((candidate) => candidate.locked)) {
      if (intervalsOverlap(cue.start, cue.end, beat.start, beat.end)) {
        issues.push(
          issue(
            `beat:${cue.id}:${beat.id}`,
            "protected_beat",
            [cue.id],
            `${cue.id} crosses the protected “${beat.label}” beat.`,
            { beatId: beat.id },
          ),
        );
      }
    }

    for (const region of reservedRegions) {
      if (
        cue.position === region.position &&
        intervalsOverlap(cue.start, cue.end, region.start, region.end)
      ) {
        issues.push(
          issue(
            `region:${cue.id}:${region.id}`,
            "reserved_region",
            [cue.id],
            `${cue.id} occupies ${cue.position} while “${region.label}” is visible.`,
            { regionId: region.id },
          ),
        );
      }
    }
  }

  const maxCps = Math.max(
    ...sorted.map(
      (cue) => countReadableCharacters(cue.text) / (cue.end - cue.start),
    ),
  );
  const lockedBeatConflicts = issues.filter(
    (candidate) => candidate.type === "protected_beat",
  ).length;

  return {
    ok: issues.length === 0,
    issueCount: issues.length,
    issues,
    metrics: {
      cueCount: sorted.length,
      maxCharactersPerSecond: Number(maxCps.toFixed(2)),
      cueOverlaps: issues.filter(
        (candidate) => candidate.type === "cue_overlap",
      ).length,
      lockedBeatConflicts,
      protectedBeatCount: beats.filter((beat) => beat.locked).length,
      reservedRegionConflicts: issues.filter(
        (candidate) => candidate.type === "reserved_region",
      ).length,
    },
  };
}

export function applyVariant(cue, variant) {
  return { ...cue, ...variant.patch };
}

function cueChangeCost(originalCue, changedCue, variant) {
  const timingMovementMs = Math.round(
    (Math.abs(changedCue.start - originalCue.start) +
      Math.abs(changedCue.end - originalCue.end)) *
      1000,
  );
  const semanticChanges =
    Number(changedCue.speaker !== originalCue.speaker) +
    Number(changedCue.position !== originalCue.position);
  return {
    changed: variant.id === "original" ? 0 : 1,
    timingMovementMs,
    semanticChanges,
  };
}

function compareCost(left, right) {
  return (
    left.cost.changedCueCount - right.cost.changedCueCount ||
    left.cost.timingMovementMs - right.cost.timingMovementMs ||
    left.cost.semanticChanges - right.cost.semanticChanges ||
    left.variantKey.localeCompare(right.variantKey)
  );
}

function planLabel(variantIds) {
  const breath = variantIds["cue-08"];
  const projection = variantIds["cue-09"];
  if (breath !== "original") {
    return "Protect Jon's final breath";
  }
  if (projection === "move-lower-left") {
    return "Lower-left projection balance";
  }
  return "Minimum movement";
}

function chooseDiversePlans(sortedPlans, maxPlans) {
  if (sortedPlans.length <= maxPlans) return sortedPlans;
  const selected = [sortedPlans[0]];
  const signatures = [
    (plan) => plan.variantIds["cue-08"],
    (plan) => plan.variantIds["cue-09"],
  ];

  for (const signature of signatures) {
    const baseline = signature(selected[0]);
    const alternative = sortedPlans.find(
      (plan) =>
        !selected.includes(plan) && signature(plan) !== baseline,
    );
    if (alternative) selected.push(alternative);
    if (selected.length >= maxPlans) return selected;
  }

  for (const plan of sortedPlans) {
    if (!selected.includes(plan)) selected.push(plan);
    if (selected.length >= maxPlans) break;
  }
  return selected;
}

export function searchTimingPlans({
  cues,
  beats,
  profile = DEMO_PROFILE,
  reservedRegions = RESERVED_REGIONS,
  maxPlans = 3,
}) {
  const variableCueIds = Object.keys(CUE_VARIANTS).sort();
  const originalById = new Map(cues.map((cue) => [cue.id, cue]));
  const combinations = [];

  function enumerate(index, chosen) {
    if (index === variableCueIds.length) {
      combinations.push({ ...chosen });
      return;
    }
    const cueId = variableCueIds[index];
    for (const variant of CUE_VARIANTS[cueId]) {
      chosen[cueId] = variant;
      enumerate(index + 1, chosen);
    }
  }
  enumerate(0, {});

  const feasible = [];
  for (const chosen of combinations) {
    const variantIds = {};
    const cost = {
      changedCueCount: 0,
      timingMovementMs: 0,
      semanticChanges: 0,
    };
    const candidateCues = cues.map((cue) => {
      const variant = chosen[cue.id] ?? original();
      variantIds[cue.id] = variant.id;
      const changedCue = applyVariant(cue, variant);
      const cueCost = cueChangeCost(cue, changedCue, variant);
      cost.changedCueCount += cueCost.changed;
      cost.timingMovementMs += cueCost.timingMovementMs;
      cost.semanticChanges += cueCost.semanticChanges;
      return changedCue;
    });
    const audit = auditTrack({
      cues: candidateCues,
      beats,
      profile,
      reservedRegions,
    });
    if (!audit.ok) continue;
    const variantKey = variableCueIds
      .map((cueId) => `${cueId}:${variantIds[cueId]}`)
      .join("|");
    feasible.push({
      id: `candidate-${feasible.length + 1}`,
      label: planLabel(variantIds),
      cues: candidateCues,
      variantIds,
      variantKey,
      cost,
      audit,
    });
  }

  feasible.sort(compareCost);
  const chosenPlans = chooseDiversePlans(feasible, maxPlans).map(
    (plan, index) => ({ ...plan, id: `plan-${index + 1}` }),
  );

  return {
    evaluatedCount: combinations.length,
    feasibleCount: feasible.length,
    plans: chosenPlans,
  };
}

function original() {
  return { id: "original", label: "Keep original", patch: {} };
}

export function summarizePlan(originalCues, plan) {
  const originals = new Map(originalCues.map((cue) => [cue.id, cue]));
  return plan.cues
    .filter((cue) => stableStringify(cue) !== stableStringify(originals.get(cue.id)))
    .map((cue) => {
      const originalCue = originals.get(cue.id);
      return {
        cueId: cue.id,
        from: {
          start: originalCue.start,
          end: originalCue.end,
          speaker: originalCue.speaker,
          position: originalCue.position,
        },
        to: {
          start: cue.start,
          end: cue.end,
          speaker: cue.speaker,
          position: cue.position,
        },
        variantId: plan.variantIds[cue.id],
      };
    });
}

export function formatTimestamp(seconds) {
  const milliseconds = Math.round(seconds * 1000);
  const hours = Math.floor(milliseconds / 3_600_000);
  const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);
  const wholeSeconds = Math.floor((milliseconds % 60_000) / 1000);
  const remainder = milliseconds % 1000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0",
  )}:${String(wholeSeconds).padStart(2, "0")}.${String(remainder).padStart(
    3,
    "0",
  )}`;
}

function webVttCueSettings(position) {
  if (position === "top") return "line:10% position:50% align:middle";
  if (position === "lower-left") return "line:90% position:10% align:start";
  return "line:90% position:50% align:middle";
}

export function exportWebVtt(cues, profile = DEMO_PROFILE) {
  const body = [...cues]
    .sort((left, right) => left.start - right.start)
    .map((cue, index) => {
      const voice = String(cue.speaker).replace(/[<>]/g, "");
      return `${index + 1}\n${formatTimestamp(cue.start)} --> ${formatTimestamp(
        cue.end,
      )} ${webVttCueSettings(cue.position)}\n<v ${voice}>${cue.text}`;
    })
    .join("\n\n");
  return `WEBVTT\n\nNOTE ${profile.label}\nNOTE ${profile.disclaimer}\n\n${body}\n`;
}

export function buildCertificate({
  workspaceRevision,
  profile,
  beats,
  audit,
  trackDigest,
  vttDigest,
  proposalDigest,
  search,
}) {
  return {
    product: "CueMend",
    certificateVersion: 1,
    workspaceRevision,
    profile: {
      id: profile.id,
      label: profile.label,
      disclaimer: profile.disclaimer,
    },
    protectedBeats: beats
      .filter((beat) => beat.locked)
      .map(({ id, label, start, end }) => ({ id, label, start, end })),
    result: {
      issueCount: audit.issueCount,
      metrics: audit.metrics,
      trackDigest,
      vttDigest,
      proposalDigest,
      evaluatedCandidates: search.evaluatedCount,
      feasibleCandidates: search.feasibleCount,
    },
    limitations: [
      "Evaluated only against the named CueMend demo production profile.",
      "Does not certify accessibility, broadcast, venue, legal, or artistic quality.",
      "Dialogue and rehearsal data are fictional and rights-safe.",
    ],
  };
}
