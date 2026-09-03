# CueMend Product and Technical Spec

## Product

**CueMend — Repair the timing. Keep the beat.**

CueMend is a rehearsal-room caption timing workbench for small theatres,
schools and live-event teams. A stage manager protects the moments that carry
the performance; a browser agent audits and exhaustively replans the remaining
cues through WebMCP; the app verifies and exports an editable WebVTT track.

The application is an inspectable demonstration workflow, not a universal
accessibility certification service. It uses a clearly named, configurable demo
production profile and fully fictional, rights-safe performance material.

## Signature journey

1. A zero-login 32-second stage fixture opens with exactly seven issues.
2. The agent reads the exact cue/beat/revision state and audits it.
3. The agent enumerates 6,561 bounded candidate tracks and stages its
   lowest-change zero-conflict proposal.
4. The preview crosses an optional breath. The stage manager clicks **Protect
   this beat**, adding a third artistic lock and invalidating the proposal.
5. The old proposal is rejected as stale; the agent replans under the new lock.
6. The human selects and approves the exact alternative. Only then does a
   one-shot commit capability appear.
7. The agent commits, re-audits zero conflicts, and exports WebVTT plus a
   SHA-256-bound certificate. All three protected beats remain unchanged.

## Production profile

The frozen fixture uses `CueMend Demo Theatre Profile v1`:

- maximum 20 readable characters per second;
- minimum cue duration 1.2 seconds;
- minimum non-overlap gap 100 ms;
- speaker label required for every dialogue cue;
- no caption may overlap a human-protected beat;
- captions may not occupy a time-bound reserved visual region;
- cue text and protected-beat definitions are never rewritten by the solver.

These are demo constraints chosen to make the engine inspectable. The UI and
documentation must never describe them as universal WCAG, theatre, broadcast
or legal requirements.

## Frozen fixture

The active track contains ten cues. Seven baseline failures are deliberately
independent:

1. cue overlap;
2. excessive reading rate;
3. a cue crossing the protected audience-laugh beat;
4. a missing speaker label;
5. a cue shorter than the profile minimum;
6. a cue crossing the protected reveal beat;
7. a top caption colliding with a reserved projection region.

An optional third beat, Jon's breath, initially remains unlocked. The first
minimum-motion proposal leaves a cue over that beat. Locking it increments the
workspace revision, turns the old proposal stale, and adds one active conflict
until the solver finds a shifted alternative.

## Human and agent authority

Only the human UI can:

- lock or unlock an artistic beat;
- select the preferred staged alternative;
- issue or revoke approval for one exact proposal digest;
- reset the fixture.

The agent can:

- inspect structured rehearsal state;
- audit the active track;
- stage a bounded deterministic plan;
- preview or discard the exact proposal;
- commit only after the UI exposes a one-shot approved capability;
- verify and export only the committed track.

The human can also perform ordinary audit/stage/commit/export actions through
visible controls as progressive enhancement. These controls call the same
command layer and do not create a second shadow state.

## WebMCP tool lifecycle

Base phase:

- `cuemend_get_rehearsal`
- `cuemend_audit_captions`
- `cuemend_stage_timing_plan`

Proposal phase adds:

- `cuemend_preview_timing_plan`
- `cuemend_discard_timing_plan`

Human approval adds exactly one capability:

- `cuemend_commit_approved_plan`

Committed phase retires mutation capabilities and adds:

- `cuemend_verify_and_export`

Registration uses the current `document.modelContext.registerTool(tool,
{signal})` API. A registration AbortSignal is distinct from the per-execution
AbortSignal delivered to each handler. Every handler repeats runtime type,
enum, identifier, phase and revision checks.

## Engine

Eight cues have three authored variants each: the original plus two bounded
repairs. The solver enumerates the exact Cartesian product (`3^8 = 6,561`),
audits every track under current locks, and keeps zero-conflict plans. Plans are
sorted by a transparent cost tuple:

1. number of changed cues;
2. total timing movement in milliseconds;
3. semantic changes (speaker/position);
4. stable lexical key.

No model invents dialogue, standards or scores. Candidate variants and every
cost component are returned in the preview.

## State and safety contracts

- `workspaceRevision` changes only when the active cue track or human locks
  change. A/B preview is shared ephemeral view state and never increments it.
- Every proposal records `baseRevision` and SHA-256 of its full alternatives.
- Any lock/edit makes the proposal stale; stale preview/approval/commit fails
  with a typed next action.
- Human approval binds proposal ID, selected plan ID, digest and base revision.
- Commit revalidates the selected track before mutation.
- A `requestId` maps to one immutable commit receipt; a repeated ID returns the
  same receipt and never applies twice.
- Tool outputs are bounded summaries. Dialogue is fixture content and is safe
  to return, but raw internal approval secrets are never exposed.
- Aborted read/search work checks its execution signal; an in-flight commit is
  short, synchronous after final validation, and reports its final state.

## UI architecture

The page is optimized for a side-by-side ChatGPT/in-app-browser recording:

- compact product header, readiness badge and copyable judge prompt;
- large stage preview with two actors, projection region, caption overlay,
  transport and A/B toggle;
- exact horizontal cue timeline with conflicts and beat bands;
- right-side rehearsal intelligence rail with metrics, issue cards, proposal,
  human lock/approval controls and receipt;
- bottom activity strip that labels HUMAN and AGENT provenance.

At narrow widths the intelligence rail stacks below the stage. Motion respects
`prefers-reduced-motion`; keyboard focus is visible; color is never the only
issue signal.

## Files

```text
index.html                 semantic app shell
styles.css                responsive theatre visual system
src/fixture.js            fictional cues, beats, variants and profile
src/engine.js             audit, exhaustive search, VTT and stable data helpers
src/commands.js           canonical revision/approval/idempotency command layer
src/webmcp.js             feature-detected dynamic tool adapter
src/app.js                rendering, playback and ordinary UI interactions
scripts/serve.mjs         dependency-free local static server
tests/engine.test.js      exact conflicts/search/locked-beat/export invariants
tests/commands.test.js    stale, approval, commit and idempotency contracts
tests/webmcp.test.js      registration phases and handler normalization
```

## Acceptance evidence

- Baseline audit is exactly seven, with every intended type present once.
- After locking the optional beat, an old proposal fails `STALE_REVISION` and
  a new audit is exactly eight.
- Replanned selected track has zero conflicts.
- All three locked beat objects and all cue texts remain byte-identical.
- Search reports exactly 6,561 evaluated tracks and at least one valid result.
- Commit without human approval fails and does not change revision.
- Replaying one `requestId` returns the same receipt and does not mutate twice.
- Exported VTT parses back into the same cue times/text and re-audits cleanly.
- Tool inventory changes across base → proposal → approved → committed phases.
- Three clean-reset live runs succeed in the supported browser.

## Explicit non-goals

No accounts, uploads, persistence, live speech recognition, translation,
automatic dialogue rewriting, external model/API, multi-show project system,
real venue integration, generalized caption standard, or certification.
