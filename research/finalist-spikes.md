# Finalist Delivery Spikes

These are paper spikes, not implemented prototypes. They compare the two likely
finalists under the same zero-dependency architecture and reserve time for live
WebMCP evidence, deployment and an under-three-minute narrated video.

## Shared delivery constraints

- Static HTML/CSS/ES modules; no framework install, backend, account or model API.
- Deterministic fixture and reset button so every judge sees the same cold start.
- One pure reducer/command layer used by both ordinary UI and WebMCP handlers.
- `document.modelContext.registerTool`, registration AbortSignals, per-execution
  cancellation checks, explicit runtime validation and bounded text results.
- Exact revision on every staged mutation; human-issued approval binds proposal
  digest and revision; commit revalidates and is idempotent.
- Native-agent evidence is separate from a local tool harness.
- Node's built-in test runner plus browser smoke/native tool run.

## Spike A — CueKind

### Signature scene

A 32-second fictional two-actor performance opens with seven visible caption
conflicts: overlaps, one excessive reading-rate segment, an ambiguous speaker,
a reserved visual-zone collision and a line crossing a human-locked laugh or
punchline beat. The stage manager locks three artistic moments. The agent audits
the exact track, searches bounded cue variants, stages a plan, and the same
timeline animates from seven red conflicts to zero without moving a lock.

The profile is explicitly a configurable demo production profile, not a claim
of universal accessibility compliance. All dialogue, stage art and sound cues
are authored for this project.

### Candidate tool lifecycle

Base tools:

1. `cuekind_get_rehearsal` — complete bounded cue/beat/profile/revision state.
2. `cuekind_audit_captions` — deterministic conflicts and metrics; no mutation.
3. `cuekind_stage_timing_plan` — enumerate variants and stage the lowest-cost
   valid plan against `expectedRevision`.

After a plan exists:

4. `cuekind_preview_timing_plan` — A/B delta and proof forecast.
5. `cuekind_discard_timing_plan` — compensating action with exact proposal ID.

After the human clicks **Approve exact cue plan**:

6. `cuekind_commit_approved_plan` — one-shot capability; checks hidden
   digest-bound approval and current revision before committing.

After commit:

7. `cuekind_verify_and_export` — independently re-audit, emit the WebVTT text,
   its digest and a constraint certificate.

### Real computation

Each unlocked cue has a small authored set of timing/speaker/position/split
variants. The engine enumerates their Cartesian product, rejects combinations
violating the declared profile or locked-beat identity, and sorts feasible plans
by a transparent edit-cost vector. This gives a truthful search count and avoids
pretending a hidden language model solved accessibility.

### File/effort estimate

| Work | Estimate |
|---|---:|
| Fixture, audit and bounded-search engine | 1.5 h |
| Reducer, revision, approval and digest contracts | 1.0 h |
| Stage/playback/timeline UI and responsive polish | 2.5 h |
| WebMCP adapter and dynamic lifecycle | 1.0 h |
| Unit/contract/adversarial tests | 1.0 h |
| Browser/native run, fixes and three clean resets | 1.5 h |
| README, license, deployment and screenshots | 1.0 h |
| Narration, capture, edit/upload and Devpost handoff | 1.5 h |
| **Total** | **11.0 h** |

### Kill/pivot triggers

- If the fixture cannot prove exactly seven baseline and zero staged conflicts
  with three byte-identical locked cues in the first engine test, pivot.
- If readable stage/timeline composition is not achieved within 2.5 UI hours,
  collapse playback to one polished stage plus a single cue rail; do not add
  tracks or settings.
- If native tool registration cannot be verified, do not substitute the local
  harness in the video; fix the runtime path or disclose the block.

## Spike B — Featherline (working rename for Flightpath)

### Signature scene

A glass facade reflects a stylized tree canopy. The human protects a few
architectural sightline anchors and chooses a motif family. The agent enumerates
marker placements and returns a Pareto set satisfying a declared two-inch
maximum open-spacing rule, minimum marker diameter and exterior-surface plan.
The same seeded illustrative bird paths replay across baseline and candidate;
the final proof is geometric compliance and marked-area coverage, not a
prediction that a particular bird would turn or a safety certification.

The two-inch spacing basis is supported by the
[U.S. Fish & Wildlife Service](https://www.fws.gov/sites/default/files/documents/reducing-bird-collisions-with-buildings.pdf),
[American Bird Conservancy](https://abcbirds.org/strategies/solutions-for-homes/)
and [FLAP/BirdSafe guidance](https://birdsafe.ca/design-standards/). The app
must state that site reflection, contrast, height, species and product testing
still require specialists.

### Candidate tool lifecycle

Base tools:

1. `featherline_inspect_facade` — grid geometry, scale, motif constraints,
   human anchors, source-linked profile and revision.
2. `featherline_audit_openings` — finds every opening exceeding the selected
   spacing rule; no mutation.
3. `featherline_search_patterns` — enumerates bounded motif offsets/densities
   and stages a Pareto frontier against `expectedRevision`.

After alternatives exist:

4. `featherline_compare_patterns` — exact spacing, marked area, anchor and
   contrast-surrogate deltas for two candidates.
5. `featherline_stage_pattern` — chooses one candidate without applying it.

After the human picks a motif and approves the exact sheet:

6. `featherline_commit_approved_pattern` — one-shot revalidated mutation.

After commit:

7. `featherline_verify_and_export` — SVG design sheet, digest, spacing map and
   explicit limitations certificate.

### Real computation

Generate a finite grid of dot/line/motif placements, calculate exact marker
diameter and maximum empty horizontal/vertical aperture, reject any plan that
violates the declared rule or human anchors, and return the nondominated set by
marked area and a disclosed aesthetic regularity measure. Animated paths are
identical-seed visual explanations only and never part of the safety score.

### File/effort estimate

| Work | Estimate |
|---|---:|
| Geometry, audit, candidate enumeration and Pareto engine | 2.0 h |
| Reducer, revision, approval and digest contracts | 1.0 h |
| Facade/SVG/path animation and responsive UI polish | 3.0 h |
| WebMCP adapter and dynamic lifecycle | 1.0 h |
| Unit/contract/source/limitation tests | 1.0 h |
| Browser/native run, fixes and three clean resets | 1.5 h |
| README, license, deployment and screenshots | 1.0 h |
| Narration, capture, edit/upload and Devpost handoff | 1.5 h |
| **Total** | **12.0 h** |

### Kill/pivot triggers

- If protected anchors make the spacing problem unsatisfiable, surface a
  smallest conflict; never silently weaken the rule.
- If a visually distinctive, obviously transformed facade is not present after
  three UI hours, the concept loses its primary advantage and should not ship.
- If the certificate cannot cleanly separate measured geometry, source-linked
  guidance and illustrative animation, pivot to CueKind rather than making an
  inflated bird-safety claim.

## Provisional comparison

| Criterion (25) | CueKind | Featherline | Reason |
|---|---:|---:|---|
| WebMCP Leverage | 24 | 23 | Both require semantic state and bounded search; CueKind's lock/replan/artifact loop is slightly more natural. |
| Execution | 22 | 19 | CueKind avoids specialist geometric/source presentation and needs less bespoke SVG behavior. |
| Potential Impact | 23 | 22 | Both serve real teams; readable live captions are easier to demonstrate truthfully without external validation. |
| Creativity & Ambition | 22 | 25 | Featherline is the rarer and more visually surprising product. |
| **Total** | **91** | **89** | CueKind leads on the official tie-break order and schedule-adjusted credibility. |

Provisional choice: **CueKind**, unless independent Round 2 jurors show that its
media-editor collision is fatal or that Featherline's geometric certificate can
be implemented with materially less credibility risk than estimated.
