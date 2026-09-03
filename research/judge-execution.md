# Round 1 — Brutal execution-feasibility audit

## Decision frame

This pass ranks the 100 ideas for the probability of shipping a polished, deterministic, judgeable entry from an otherwise empty folder before the deadline. It deliberately does **not** reward an idea for being intellectually impressive if the implementation, browser validation, or three-minute story is likely to be unfinished.

The practical budget is not fourteen hours of feature work. A credible submission must reserve roughly three hours for:

- real WebMCP invocation in the supported browser, including at least one multi-tool path and one rejected/stale path;
- focused deterministic tests and a clean reset fixture;
- public repository, license, deployment, README, screenshots, and submission copy;
- recording and trimming the under-three-minute narrated demo.

Under the current ORANGE resource state, the safest architecture is a zero-install static app: HTML/CSS/ES modules, bundled SVG/CSS assets, Node's built-in test runner if Node is already present, and no backend. UI actions and WebMCP handlers must call the same pure command/reducer layer. A local “agent simulator” is useful for development but is not evidence of WebMCP; the recorded happy path must show a real tool invocation in ChatGPT's in-app browser or supported Chrome.

Scores use five equally weighted dimensions, each out of 5:

- **Time** — fits the real build plus submission budget.
- **Det** — deterministic and straightforward to test.
- **Polish** — can look and feel like a product in the time left.
- **MCP** — naturally supports a non-trivial typed WebMCP sequence.
- **Safe** — independence from external services, data, and unsupported claims.

`Total` is the weighted score out of 100. The adjacent confidence is a harsher estimate of the chance that one builder can produce a submission-quality result, not merely running code.

## Top 16

| Rank | ID | Candidate | Total | Completion confidence | All-in ship estimate | Time | Det | Polish | MCP | Safe |
|---:|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 15 | **Consent Compiler** | 97 | 91% | 10.5–12h | 5.0 | 5.0 | 4.6 | 4.7 | 5.0 |
| 2 | 62 | **Focus Treaty** | 96 | 88% | 10.5–12h | 4.7 | 5.0 | 4.8 | 4.8 | 5.0 |
| 3 | 47 | **CanonLock** | 95 | 87% | 11–12.5h | 4.5 | 5.0 | 4.7 | 4.7 | 5.0 |
| 4 | 34 | **LaundryProof** | 94 | 90% | 9.5–11h | 5.0 | 5.0 | 4.4 | 4.2 | 5.0 |
| 5 | 13 | **ConsentCut Media** | 93 | 84% | 10.5–12.5h | 4.5 | 5.0 | 4.8 | 4.5 | 4.5 |
| 6 | 75 | **LoopStage** | 92 | 86% | 9.5–11.5h | 5.0 | 4.8 | 4.5 | 4.3 | 4.5 |
| 7 | 48 | **TypeBridge** | 91 | 83% | 10.5–12.5h | 4.5 | 4.8 | 4.7 | 4.5 | 4.3 |
| 8 | 64 | **Cascade Court** | 90 | 81% | 10.5–12.5h | 4.4 | 4.7 | 4.7 | 4.6 | 4.1 |
| 9 | 68 | **ConsentMaze** | 89 | 86% | 9.5–11h | 5.0 | 5.0 | 3.8 | 4.5 | 4.0 |
| 10 | 17 | **Secretless Support** | 88 | 85% | 10–11.5h | 4.8 | 5.0 | 4.0 | 4.4 | 3.8 |
| 11 | 52 | **Proof Garden** | 87 | 80% | 11–13h | 4.2 | 4.8 | 4.5 | 4.8 | 3.5 |
| 12 | 44 | **ZineFold** | 86 | 78% | 11.5–13h | 4.1 | 4.9 | 4.9 | 4.1 | 3.5 |
| 13 | 35 | **Room Reset Relay** | 85 | 80% | 11–12.5h | 4.4 | 4.8 | 4.5 | 4.4 | 3.2 |
| 14 | 24 | **QuoteLens** | 84 | 84% | 10–11.5h | 4.8 | 5.0 | 4.0 | 4.0 | 3.2 |
| 15 | 55 | **Claim Court** | 83 | 77% | 10.5–12.5h | 4.5 | 4.7 | 4.4 | 4.3 | 2.9 |
| 16 | 26 | **SpecLock** | 81 | 72% | 12–13.5h | 3.8 | 4.8 | 4.8 | 4.4 | 2.5 |

The all-in estimates already include tests, one live WebMCP verification pass, deployment/repository work, and video capture. They assume the scope below is frozen; adding authentication, persistence beyond local state, an LLM/API, multiplayer, file upload, or a second scenario makes most estimates invalid.

## Candidate-by-candidate risks

### 1. Consent Compiler (#15)

- **Frozen scope:** one fictional photo SaaS, eleven declared purposes, a feature-dependency graph, three privacy goals, deterministic policy simulation, stage/diff/apply receipt, reset.
- **Technical unknowns:** dynamic registration/removal of stage/apply tools; stale policy-version rejection; digesting the exact proposed diff so an old approval cannot apply to new state.
- **External dependencies:** none beyond the supported WebMCP browser and static host.
- **Likely failure mode:** implying that UI settings prove backend privacy, or displaying a percentage with no inspectable calculation. The app must call itself a policy simulator and show every dependency contributing to “features retained.”
- **Why it survives:** tiny closed-world engine, strong before/after visual, measurable result, and a natural inspect → simulate → stage → human approve → verify tool lifecycle.

### 2. Focus Treaty (#62)

- **Frozen scope:** one deliberately broken modal flow, a real focus-event trace, one trapped path, a staged DOM fix, and red/green replay using the same live elements.
- **Technical unknowns:** collecting reliable focus traces; replaying keyboard intent without faking the event sequence; restoring focus correctly after modal close.
- **External dependencies:** none; use native DOM and custom SVG, not an accessibility service.
- **Likely failure mode:** the “trace” is a canned animation rather than actual DOM evidence, or the patch is presented as universal WCAG certification.
- **Why it survives:** it makes the browser itself the deterministic domain engine and gives unusually credible before/fix/verify evidence with little content production.

### 3. CanonLock (#47)

- **Frozen scope:** a prewritten twelve-node mystery, four knowledge/item/time rules, path enumeration, one contradiction, a staged prerequisite-edge patch, route replay, undo.
- **Technical unknowns:** cycle/path enumeration and a legible graph layout; keeping prose authored by the human while the agent edits only structure.
- **External dependencies:** none.
- **Likely failure mode:** becoming a generic graph linter, or requiring too much narrative explanation before the contradiction is visible.
- **Why it survives:** a small deterministic engine, striking red-thread visual, objective zero-contradiction certificate, and an easy-to-demonstrate human/agent division of labor.

### 4. LaundryProof (#34)

- **Frozen scope:** twenty illustrated garment cards, ten curated care labels, a compatibility matrix, grouping, quarantine, preview/commit/undo, zero-conflict check.
- **Technical unknowns:** none substantial; label semantics must be hand-curated and the incompatibility explanation must come directly from the matrix.
- **External dependencies:** none; draw all icons locally.
- **Likely failure mode:** looking trivial or quietly making a wrong fabric-care claim. Do not infer unknown garments; visibly quarantine them.
- **Why it survives:** the fastest route to a cohesive product with obvious physical-world input, deterministic grouping, motion, a failure branch, and easy tests.

### 5. ConsentCut Media (#13)

- **Frozen scope:** eight to twelve synthetic, pre-tagged illustrated shots; a purpose/subject/usage consent matrix; collage/cut assembly; revoke/recompose; provenance manifest.
- **Technical unknowns:** quickly producing attractive rights-safe art; deterministic replacement scoring; preserving manual editorial pins during recomposition.
- **External dependencies:** none if every image is locally drawn or generated for the demo and documented as synthetic.
- **Likely failure mode:** accidental face-recognition implication, unclear media rights, or spending the build window on assets instead of the tool loop.
- **Why it survives:** revocation causes an immediate, memorable visible state change and the permission model is simple enough to test exhaustively.

### 6. LoopStage (#75)

- **Frozen scope:** five asset types, four processing stations, fixed capacities, three condition reports, deterministic turnaround plan, quarantine, receipt, reset.
- **Technical unknowns:** keeping particle animation synchronized with the actual reducer state; deterministic capacity scheduling.
- **External dependencies:** none.
- **Likely failure mode:** reading as warehouse CRUD or presenting “landfill avoided” as a real-world fact rather than a fixture-derived modeled count.
- **Why it survives:** lowest implementation risk among visually animated concepts; a physical human observation forces a visible reroute and can be verified numerically.

### 7. TypeBridge (#48)

- **Frozen scope:** one poster, human-approved EN/ZH/AR copy, three viewport sizes, actual DOM measurement, deterministic overflow/RTL audit, staged layout adaptations, A/B compare.
- **Technical unknowns:** repeatable text metrics across the judging browser; bundled font coverage; correct RTL layout in the three fixed fixtures.
- **External dependencies:** no translation API and no remote fonts; use approved strings and system-safe/bundled type.
- **Likely failure mode:** claiming translation/cultural quality, or measuring a synthetic box instead of the rendered DOM.
- **Why it survives:** objective live-browser evidence and a colorful three-viewport visual without needing a server or model.

### 8. Cascade Court (#64)

- **Frozen scope:** one deliberately broken responsive component, four fixed viewports, declared visual invariants, breakpoint bisect, cascade trace, staged CSS-variable/class patch, verify/reset.
- **Technical unknowns:** rendering four isolated previews consistently (prefer `srcdoc` or shadow roots); making the patch real rather than repainting a mock screenshot.
- **External dependencies:** none.
- **Likely failure mode:** a self-contained developer toy with a hard-coded answer; the live DOM and computed styles must be inspectable.
- **Why it survives:** technical credibility is easy to prove on camera, and the red-to-green four-viewport reveal is compact and polished.

### 9. ConsentMaze (#68)

- **Frozen scope:** a small permission-state graph, declared UX invariants, deterministic exploration, one coercive deny→reprompt loop, limited-mode patch, replay and certificate.
- **Technical unknowns:** a concise BFS/state exploration implementation and dynamic capability removal after denial.
- **External dependencies:** none.
- **Likely failure mode:** looking like a generic state-machine test bench or reproducing competitors' security story too closely.
- **Why it survives:** extremely testable, fast, naturally demonstrates state-aware tool availability, and contains a real adversarial/failure branch.

### 10. Secretless Support (#17)

- **Frozen scope:** one synthetic upload failure, three deterministic diagnostic probes, raw local log, allowlisted evidence view, redacted bundle preview, ticket receipt/revoke.
- **Technical unknowns:** airtight separation between local raw data and agent-returned facts; deterministic redaction and test fixtures.
- **External dependencies:** no support API; ticket creation is explicitly simulated.
- **Likely failure mode:** leaking the raw secret into a tool result, or reducing to a regex redaction demo with no diagnosis workflow.
- **Why it survives:** a useful, believable workflow with an easily testable privacy boundary and no external integrations.

### 11. Proof Garden (#52)

- **Frozen scope:** propositional logic only, a tiny fixed rule set, labeled occurrences/open premises, legal-step checker, one circular-assumption witness, staged legal repair, proof certificate.
- **Technical unknowns:** precise scope/occurrence bookkeeping and a layout that makes the proof readable.
- **External dependencies:** none; do not invoke a theorem prover or LLM.
- **Likely failure mode:** accepting an invalid inference, hiding an open premise, or calling the demo a general theorem prover.
- **Why it survives:** unlike specialized scientific models, this closed formal system can be exhaustively tested and produces objective evidence.

### 12. ZineFold (#44)

- **Frozen scope:** exactly one supported eight-page A4 duplex signature, fixed paper orientation, imposition calculation, page-order audit, fold animation, print-ready layout.
- **Technical unknowns:** front/back orientation and printer flip convention; synchronizing the SVG fold with actual calculated page positions.
- **External dependencies:** none; browser print/PDF export is optional and must not block submission.
- **Likely failure mode:** one mirrored/reversed page makes the central claim false, or the fold animation consumes the remaining polish time.
- **Why it survives:** narrow mathematics, a delightful signature reveal, and a real artifact instead of a generic dashboard.

### 13. Room Reset Relay (#35)

- **Frozen scope:** a 4×4 room, twelve objects, one goal (“clear a path to bed”), short action planner, physical ground-truth update such as “too heavy,” replan, preview/commit/undo.
- **Technical unknowns:** defining a tiny but coherent spatial transition model; animating object moves without layout bugs.
- **External dependencies:** none.
- **Likely failure mode:** degrading into a checklist, or claiming perception the agent does not have. Every physical fact must originate from the human.
- **Why it survives:** the need for human ground truth is immediately understandable and the replanned path can be visibly verified.

### 14. QuoteLens (#24)

- **Frozen scope:** one fictional storefront-sign purchase, three fixed quotes, a transparent normalization matrix, omission handling, sourced line-item drawer, staged award and undo.
- **Technical unknowns:** only the rule table and clear provenance highlighting.
- **External dependencies:** none; do not scrape or contact vendors.
- **Likely failure mode:** subjective equivalence rules or generic procurement UI; “not specified” must never silently become “included.”
- **Why it survives:** low engineering risk, easy test coverage, and a crisp reveal where the apparent cheapest quote becomes the most expensive.

### 15. Claim Court (#55)

- **Frozen scope:** a fully synthetic twelve-source evidence graph, source-type metadata, strongly connected component/review-loop detection, claim support tracing, staged verdict card, human-only signature.
- **Technical unknowns:** making evidence edges comprehensible in seconds; separating structural graph findings from scientific truth.
- **External dependencies:** none.
- **Likely failure mode:** becoming a text summarizer or implying that citation counts establish correctness.
- **Why it survives:** graph algorithms are deterministic and the “heavily cited but circular” reveal is memorable if the fixture is concise.

### 16. SpecLock (#26)

- **Frozen scope:** one parametric SVG object, at most eight maker constraints, a small legal-value grammar, deterministic price formula, conflict explanation, staged spec/version diff, human freeze.
- **Technical unknowns:** visual quality of the configurator and choosing constraints that are credible without manufacturing expertise.
- **External dependencies:** none.
- **Likely failure mode:** a storefront configurator with an agent wrapper, or polish work overrunning the deadline.
- **Why it survives:** the agent changes a real shared artifact through a bounded grammar and every constraint/price result can be tested.

## Top-four recommendation

1. **Consent Compiler** is the safest overall build. It has the best ratio of WebMCP-native state transitions to UI/algorithm cost. The demo can show inspect, goal translation, simulation, a stale-version rejection, human approval, capability removal, and a verifiable receipt in well under three minutes.
2. **Focus Treaty** is the best execution-proof story. Its domain truth comes from the actual browser rather than a fabricated specialist model. Choose it if the team can prove the trace and patch operate on live DOM, not a canned animation.
3. **CanonLock** is the best visual/domain-engine balance. It is more distinctive than a developer test harness, yet remains a finite graph problem with no external data.
4. **LaundryProof** is the schedule-safe fallback. It can be fully polished and exhaustively tested earliest, leaving the most time for the live WebMCP recording and submission package; its ceiling is lower unless the quarantine/replan moment is made exceptional.

If only one implementation can start immediately, choose **Consent Compiler**. If its privacy-policy framing feels too close to existing governance entries after collision review, switch to **CanonLock**, not to a larger simulator.

## Disposition of all 100

The following sets are mutually exclusive and cover every ledger ID exactly once.

### Selected Top 16

`13, 15, 17, 24, 26, 34, 35, 44, 47, 48, 52, 55, 62, 64, 68, 75`

### Feasible near-cut, but lower completion-adjusted payoff

`1, 2, 8, 12, 19, 21, 22, 27, 29, 30, 32, 33, 38, 40, 41, 43, 45, 53, 56, 59, 60, 65, 67, 70, 72, 78, 79, 81, 82, 83, 85, 86, 87, 89, 93, 95, 100`

These are not impossible. They lose this execution pass because at least one of the following dominates: saturated scheduler/route/approval UX; multiple simulated users; a text-heavy or abstract three-minute story; substantial bespoke illustration/animation; or weaker measurable evidence. The closest alternatives are #41 CueKind, #59 Field Evidence Time Machine, #67 Locale Storm, #72 DeconstructOS, and #89 Gift Cipher.

### Hard reject: specialist/high-stakes accuracy or unverifiable model

`3, 4, 5, 6, 7, 9, 10, 11, 14, 18, 20, 23, 25, 28, 31, 36, 37, 39, 42, 51, 54, 57, 58, 66, 71, 73, 74, 76, 77, 80, 84, 88, 90, 91, 97, 99`

These require legal, medical, disaster, food-safety, conservation, causal/statistical, accessibility-planning, manufacturing, energy/fairness, or emotionally sensitive claims that cannot be made credible from a hastily authored fixture. Disclaimers reduce harm but do not repair judge skepticism about an arbitrary domain engine. They violate the explicit execution brief to reject ideas needing specialized accuracy.

### Hard reject: direct collision or duplicate concept

`16, 61, 63, 69, 92, 94, 96`

- #61 ChronoBug and #69 Webhook Noir run into the already strong Paradox/model-checking lane.
- #63 ToolFence runs into Ninth Tool, Reviewline, and other WebMCP security/conformance entries.
- #16 ExitRamp is another cancellation workflow in a very crowded commerce field.
- #92 duplicates #13, #94 duplicates route/sensory concepts, and #96 duplicates CueKind with more scope.

### Hard reject: likely runtime/asset/engine overrun

`46, 49, 50, 98`

QuietMix needs reliable Web Audio assets and audible A/B capture; PatternNest and Patchwork need credible polygon packing/physics; Signal & Sail needs a playable game, controls, simulation, cancellation, and polished recording. Each could be excellent with days, but each is a deadline trap now.

## Non-negotiable implementation constraints for any finalist

- Freeze one scenario and one outcome. No authentication, backend, external API, live user data, multiplayer, upload parser, or generative model.
- Implement 5–7 atomic typed tools, not 20 aliases. Include at least two read tools, one preview/stage mutation, one verify tool, and a reset path. Keep final consequential approval human-only when possible.
- Make tool availability state-aware: a stage tool appears only after inspection; apply/commit is not exposed until a valid staged diff exists; stale versions fail with an actionable error; committed mutations retire.
- Return structured evidence from each tool and immediately update the visible UI. Never return success text without the state actually changing.
- Put domain rules in pure functions and exhaustively test the small fixture. UI clicks and tool calls dispatch the same commands.
- Record one successful multi-step journey, one safety/stale rejection, one human intervention, and one final numeric/certificate verification. A local scripted harness may support tests but cannot replace the real WebMCP call in the submitted video.
- Keep the repository dependency-free if practical. Under ORANGE, a framework install is not worth losing the live-browser validation window.

