export const DEMO_PROFILE = Object.freeze({
  id: "cuemend-demo-theatre-v1",
  label: "CueMend Demo Theatre Profile v1",
  maxCharactersPerSecond: 20,
  minCueDurationSeconds: 1.2,
  minGapSeconds: 0.1,
  durationSeconds: 32,
  disclaimer:
    "A transparent demo production profile, not a universal accessibility or compliance standard.",
});

export const RESERVED_REGIONS = Object.freeze([
  {
    id: "projection-title",
    label: "Projected chapter title",
    start: 24,
    end: 28,
    position: "top",
  },
]);

export const INITIAL_BEATS = Object.freeze([
  {
    id: "beat-laugh",
    label: "Audience laugh",
    detail: "Let the joke breathe before the next caption appears.",
    start: 8.3,
    end: 9.2,
    locked: true,
  },
  {
    id: "beat-reveal",
    label: "Lighting reveal",
    detail: "Keep the visual reveal free of text.",
    start: 15.6,
    end: 16.4,
    locked: true,
  },
  {
    id: "beat-breath",
    label: "Jon's final breath",
    detail: "Optional pause; only the stage manager can protect it.",
    start: 19.45,
    end: 19.7,
    locked: false,
  },
]);

export const INITIAL_CUES = Object.freeze([
  {
    id: "cue-01",
    start: 0.6,
    end: 3.2,
    speaker: "MARA",
    text: "When the lights die, count to four.",
    position: "bottom",
  },
  {
    id: "cue-02",
    start: 3.1,
    end: 5.6,
    speaker: "JON",
    text: "Four? Last week you said three.",
    position: "bottom",
  },
  {
    id: "cue-03",
    start: 5.9,
    end: 7.9,
    speaker: "MARA",
    text: "Last week, the moon was listening elsewhere.",
    position: "bottom",
  },
  {
    id: "cue-04",
    start: 8.7,
    end: 10.8,
    speaker: "JON",
    text: "It heard you. It just chose silence.",
    position: "bottom",
  },
  {
    id: "cue-05",
    start: 11.65,
    end: 13.95,
    speaker: "",
    text: "Then tell it I'm done whispering.",
    position: "bottom",
  },
  {
    id: "cue-06",
    start: 14.2,
    end: 14.9,
    speaker: "JON",
    text: "Wait.",
    position: "bottom",
  },
  {
    id: "cue-07",
    start: 16,
    end: 18.8,
    speaker: "MARA",
    text: "The city is listening now.",
    position: "bottom",
  },
  {
    id: "cue-08",
    start: 19.55,
    end: 22.55,
    speaker: "JON",
    text: "Then let's give it something worth hearing.",
    position: "bottom",
  },
  {
    id: "cue-09",
    start: 24.5,
    end: 27.2,
    speaker: "MARA",
    text: "Start with the truth.",
    position: "top",
  },
  {
    id: "cue-10",
    start: 28,
    end: 31,
    speaker: "JON",
    text: "And leave enough quiet to hear it land.",
    position: "bottom",
  },
]);

const original = (label = "Keep original") => ({
  id: "original",
  label,
  patch: {},
});

export const CUE_VARIANTS = Object.freeze({
  "cue-02": [
    original(),
    {
      id: "settle-after-opening",
      label: "Settle after opening cue",
      patch: { start: 3.3, end: 5.55 },
    },
    {
      id: "shift-after-opening",
      label: "Shift after opening cue",
      patch: { start: 3.35, end: 5.65 },
    },
  ],
  "cue-03": [
    original(),
    {
      id: "extend-reading-window",
      label: "Extend reading window",
      patch: { end: 8.1 },
    },
    {
      id: "open-reading-window",
      label: "Open reading window",
      patch: { start: 5.8, end: 8.05 },
    },
  ],
  "cue-04": [
    original(),
    {
      id: "land-after-laugh",
      label: "Land after audience laugh",
      patch: { start: 9.3, end: 11.4 },
    },
    {
      id: "breathe-after-laugh",
      label: "Add breath after audience laugh",
      patch: { start: 9.35, end: 11.45 },
    },
  ],
  "cue-05": [
    original(),
    {
      id: "label-mara",
      label: "Identify Mara",
      patch: { speaker: "MARA" },
    },
    {
      id: "label-mara-offstage",
      label: "Identify Mara offstage",
      patch: { speaker: "MARA · OFFSTAGE" },
    },
  ],
  "cue-06": [
    original(),
    {
      id: "hold-wait",
      label: "Hold the interruption",
      patch: { start: 14.15, end: 15.35 },
    },
    {
      id: "hold-wait-late",
      label: "Hold the interruption later",
      patch: { start: 14.2, end: 15.4 },
    },
  ],
  "cue-07": [
    original(),
    {
      id: "after-reveal",
      label: "Enter after lighting reveal",
      patch: { start: 16.5, end: 19.3 },
    },
    {
      id: "after-reveal-wide",
      label: "Enter after reveal with more air",
      patch: { start: 16.55, end: 19.35 },
    },
  ],
  "cue-08": [
    original("Keep Jon on the optional breath"),
    {
      id: "after-final-breath",
      label: "Enter after Jon's final breath",
      patch: { start: 19.8, end: 22.8 },
    },
    {
      id: "after-final-breath-wide",
      label: "Give Jon's final breath more air",
      patch: { start: 19.85, end: 22.85 },
    },
  ],
  "cue-09": [
    original(),
    {
      id: "move-lower-third",
      label: "Move below the projection",
      patch: { position: "bottom" },
    },
    {
      id: "move-lower-left",
      label: "Move to lower-left safe region",
      patch: { position: "lower-left" },
    },
  ],
});

export function createInitialWorkspace() {
  return {
    workspaceRevision: 1,
    phase: "baseline",
    profile: structuredClone(DEMO_PROFILE),
    reservedRegions: structuredClone(RESERVED_REGIONS),
    beats: structuredClone(INITIAL_BEATS),
    cues: structuredClone(INITIAL_CUES),
    proposal: null,
    preview: null,
    previewSerial: 0,
    approval: null,
    receipt: null,
    lastVerification: null,
    committedRequests: {},
    activity: [
      {
        id: "activity-001",
        actor: "SYSTEM",
        action: "Loaded deterministic rehearsal fixture",
        detail: "Revision 1 · 10 cues · 2 protected beats",
      },
    ],
  };
}
