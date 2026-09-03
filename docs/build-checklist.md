# CueMend Autonomous Build Checklist

Mode: autonomous speed-run, no mid-build user pauses. The user explicitly asked
for a complete overnight build. Resource-gated commands remain subject to the
machine Sentinel. Formal Devpost submission remains separately gated by rules
acknowledgment and final submission confirmation.

- [x] **1. Freeze the fixture and pure audit/search engine**
  Acceptance: exactly seven baseline issues; 6,561 candidates; zero-conflict
  post-lock plan; text and beat invariants.
  Verify: `node --test tests/engine.test.js`.

- [x] **2. Implement canonical commands and authority state machine**
  Acceptance: revision-bound staging, stale rejection, human-only lock/approval,
  one-shot commit and idempotent receipts.
  Verify: `node --test tests/commands.test.js`.

- [x] **3. Implement dynamic WebMCP adapter**
  Acceptance: expected inventories in all four phases, runtime validation,
  registration/execution AbortSignals and bounded normalized responses.
  Verify: `node --test tests/webmcp.test.js`.

- [ ] **4. Build stage, timeline and responsive product shell**
  Acceptance: baseline conflicts are immediately legible, playback/scrub works,
  protected beats are actionable, A/B preview and human approval are visible.
  Verify: desktop and split-width browser screenshots plus keyboard pass.

- [ ] **5. Connect ordinary UI to the canonical command layer**
  Acceptance: audit → stage → protect beat → stale → restage → select → approve
  → commit → verify/export works without WebMCP and records provenance.
  Verify: one clean reset manual run and matching state snapshot.

- [x] **6. Run focused automated and adversarial verification**
  Acceptance: all unit/contract tests pass; source search finds no placeholder,
  hidden network dependency or stale project name; abort/invalid/stale/no-approval
  paths leave state safe.
  Verify: `npm test` and focused `rg` checks.

- [ ] **7. Verify native WebMCP end-to-end**
  Acceptance: real browser agent discovers tools, completes the multi-tool loop,
  an actual stale attempt is refused, UI updates after each call, and reset works
  three times. A local harness alone does not count.
  Verify: recorded tool inventory/results and screenshots from live runs.

- [ ] **8. Package public repository and live deployment**
  Acceptance: MIT license, reproducible README, exact limitations, source-linked
  standards context, public URL, deployed-source parity and zero-login cold load.
  Verify: clean clone/static serve and remote HTTP/browser checks.

- [ ] **9. Produce submission assets**
  Acceptance: polished screenshots, under-three-minute narrated script/video,
  concise English Devpost copy, testing instructions and exact WebMCP explanation.
  Verify: duration/audio/public visibility/URL checks and submission checklist.

- [ ] **10. Devpost handoff**
  Acceptance: every required field and link is ready. Do not make a formal
  submission without the strict user confirmation required by the plugin flow.
  Verify: live Devpost status after any authorized submission.
