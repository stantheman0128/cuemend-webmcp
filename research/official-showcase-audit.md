# Official and Supporter Showcase Audit

Evidence cutoff: 2026-09-04. This is an implementation-oriented reading of
the first-party resources linked by the challenge, not a claim that these
examples are entrants or judging winners.

## Why these examples matter

The official examples do not reward tool count by itself. OpenAI curates both
a two-tool Rubik's cube and a 39-tool browser CAD studio. Across OpenAI,
GoogleChromeLabs, Cloudflare, Vercel/Shopify and Angular, the recurring design
language is:

1. Read structured state before acting.
2. Expose domain verbs rather than DOM controls.
3. Route human UI and tools through one canonical command/state path.
4. Return postconditions, revisions and structured evidence.
5. Encode protection in API shape: atomic batches, optimistic revisions,
   protected human edits, preview/commit, undo or compensating actions.
6. Add and retire capabilities when role or workflow state changes.
7. Make every important tool call visible in the ordinary UI.
8. Leave an artifact that the human can continue editing.
9. Revalidate at runtime; schema text is not an enforcement boundary.
10. Finish with a portable artifact, receipt, certificate or export.

The important negative signal is just as clear: shopping, booking, travel,
meal planning, generic documents, media editors, CAD and games all have strong
official examples already. A submission in one of those areas needs a distinct
domain mechanism, not simply better styling or more tools.

## OpenAI WebMCP showcase

The [WebMCP-filtered OpenAI Showcase](https://developers.openai.com/showcase?view=webmcp-apps)
contained ten curated applications at inspection time.

| Application | Observed surface and strongest lesson | Limitation / occupied territory |
|---|---|---|
| [Margin Editor](https://developers.openai.com/showcase/margin-editor) | 10 document/comment tools; agent authorship stays distinct from human authorship, quote anchors disambiguate occurrences, and both actors edit the same local document. | Document/comments are occupied; no multi-user merge, semantic diff or evidence-backed version history. |
| [Fieldwork // 12](https://developers.openai.com/showcase/ko-field-beat-machine) | 26 browser music tools, deterministic mutation, project save/load, undo/redo and WAV export. Immediate audible and visual feedback makes tool effects unmistakable. | General music/creative editors are occupied, and 26 flat controls create orchestration cost. |
| [WanderNote](https://developers.openai.com/showcase/wandernote) | 11 itinerary/map/feedback/export tools. Agent suggestions fill free slots without overwriting human edits. | Travel planning is crowded; sample context and no verified availability. |
| [Sunday Table](https://developers.openai.com/showcase/sunday-table) | 12 tools over one meal-plan source of truth and derived grocery state. Human-authored meals are protected and batch planning is atomic. | Meal planners are crowded and data is local/static. |
| [Paperie](https://developers.openai.com/showcase/paperie) | 13 greeting-card tools. Agent context becomes a visible editable artifact, alt text is required, and `review_and_print` stops before purchase. | Visual content/product previews are crowded; rights/provenance are thin. |
| [Webroom](https://developers.openai.com/showcase/webroom) | 28 local photo-editing tools, readable preview/history, full-resolution export and undo/redo. | A large set of global sliders is not a novel agent workflow; image editors are occupied. |
| [Verdant Market](https://developers.openai.com/showcase/verdant-market) | A compact nine-tool catalog/cart surface and shared state. | Static commerce and checkout-summary demos are heavily occupied. A live exposure discrepancy was observed once; source definitions do not prove the deployed registry works in every session. |
| [Crossword Desk](https://developers.openai.com/showcase/crossword-desk) | Five tools, a real construction algorithm, optimistic revision and partial batch rejection. This is the clearest example of few orthogonal tools carrying a real domain engine. | Puzzles have low impact and are crowded. |
| [Codex Modeling Studio](https://developers.openai.com/showcase/codex-modeling-studio) | 39 WebAssembly/WebGPU project, scene, mesh, material, inspection and export tools. Render-capture and capability search support a real inspect/refine loop. | This sets an impractical ceiling for another general CAD/editor entry; startup and surface complexity are large. |
| [Cubecade](https://developers.openai.com/showcase/cubecade-rubiks) | Only `get_cube_state` and `queue_cube_moves`: complete read, bounded batch action, shared 3D animation and immediate verification. A human can rotate and the agent can continue. | It is a puzzle, but it proves two exact tools can be more compelling than 30 wrappers. |

Across these ten applications, the decisive lesson is density rather than size:
each tool should advance a shared artifact or reveal domain evidence. Our entry
should be closer to Cubecade/Crossword's orthogonality than Webroom's long slider
catalog, while carrying a more consequential audience and outcome.

## Cloudflare coffee-store reference

Official/supporter links:

- [Live coffee store](https://webmcp-coffee.jilles.fyi/)
- [Repository](https://github.com/jillesme/webmcp-coffee-store)
- [Fixed source snapshot](https://github.com/jillesme/webmcp-coffee-store/tree/f34b6644a8ee75f9763a24134b99a39da12e0c80)
- [Cloudflare WebMCP article](https://blog.cloudflare.com/webmcp/)
- [Challenge landing demo](https://webmcp-challenge.examples.workers.dev/)

The store has four tools before fake login and dynamically adds `checkout`
after login. A declarative roast filter and imperative cart actions share the
same Zustand state; inputs have enums/bounds plus runtime revalidation; results
return cart postconditions; ordinary UI remains functional without WebMCP.

Its limits are strategically important: all state is browser-local, the agent
does not get a complete catalog/cart read surface, checkout merely clears the
cart, there is no immutable review, order, idempotency, undo or receipt, and no
formal test/eval suite. Cloudflare is only the static host in this sample. A
general coffee/store entry would therefore be both saturated and easy to
compare unfavorably with stronger submissions.

## Vercel Shop and Shopify: avoid the version trap

Relevant sources:

- [Vercel Shop](https://github.com/vercel/shop)
- [Historical implementation PR #498](https://github.com/vercel/shop/pull/498)
- [Replacement/revert PR #504](https://github.com/vercel/shop/pull/504)
- [Current guide](https://github.com/vercel/shop/blob/main/apps/docs/content/docs/anatomy/webmcp.mdx)
- [Shopify WebMCP documentation](https://shopify.dev/docs/api/web-mcp)

Three different claims must not be conflated:

1. The inspected live `template.vercel.shop` bundle had WebMCP disabled and
   exposed no tools in that observation.
2. Historical PR #498 implemented four Vercel-owned tools with AbortSignal
   cleanup, server revalidation, exact variant resolution, serialized writes,
   bounded/redacted output and an explicit unsafe-to-retry ambiguous-mutation
   result. It was later reverted.
3. Current main can load Shopify's CDN-owned WebMCP runtime when a flag is on.
   The inspected v0.1.4 manifest had eleven tools covering discovery, product,
   cart, checkout navigation, order management and policy search. That runtime
   had drifted from documentation that described ten tools.

The product lesson is strong: generic commerce has effectively been
commoditized, and a deployed source definition is not proof of live tool
exposure. Pinning, deployed-source parity, exact runtime inspection and native
tool execution all belong in our evidence package.

## GoogleChromeLabs runnable demos

The [GoogleChromeLabs WebMCP tools repository](https://github.com/GoogleChromeLabs/webmcp-tools)
contained 16 runnable demos at the inspected snapshot
[`41cb97a`](https://github.com/GoogleChromeLabs/webmcp-tools/tree/41cb97a29002a2f2d3fb3ab05bde92652118c667/demos).
All 16 live URLs returned HTTP 200 during the audit; reachability alone does not
establish a successful tool invocation.

| Demo | Core mechanic worth learning | Principal limitation |
|---|---|---|
| Analytics Dashboard | One atomic `query` updates filters and visualization together, avoiding intermediate stale state. | Mock data and weak structured result. |
| Coffee Shop | Route-spanning search/history/reorder/specification with local state and visible feedback. | Static and contains correctness shortcuts. |
| Mystery Doors | The clearest dynamic capability topology: entering a room replaces available tools; `castLight` retires after use. | A toy, with schema/runtime rough edges. |
| Appointment Explainer | Minimal read/write/compensating action that explains WebMCP versus DOM automation. | Session-only mock and a fallback simulator that can be mistaken for native execution. |
| Le Petit Bistro | Broad declarative/imperative, autosubmit and cross-document testbed. | No real availability or receipt; one rendering path risks injection. |
| Hotel Chain | Global and route-scoped search/filter/read/booking tools with a human final-submit boundary. | Mock inventory/payment and documentation drift. |
| Angular Leather Bag | Framework-native lifecycle, dependency injection and Signal Form schema inference. | Incomplete cart lifecycle and validation gaps. |
| Order Tracking | Very small cross-document status/return surface. | Consequential return auto-submits with no eligibility or confirmation. |
| Page Agent | Cross-origin discovery plus dependency-addressable batch orchestration and measurable round-trip savings. | Origin policy, approval and rollback are under-specified; local API-key/XSS risk. |
| zaMaker Pizza | Immediate visual state, enum-bounded actions, reset/remove and shareable state URL. | No complete read surface; toy configurator. |
| React Flight Search | Tool promise resolves only after UI state updates; includes a rare output schema. | Mock flights and a schema/runtime mismatch. |
| Real Estate Map | Compound semantic filtering produces synchronized map feedback. | API key requirement and hard-coded data. |
| Smart Home | A single high-level intent tool rearranges the UI instead of exposing many widget operations. | Invalid identifiers and no diff/undo/authority. |
| Angular Sports Shop | Rich global/route/modal tool lifecycle and an end-to-end commerce state machine. | Simulated order and an agent-callable final confirmation. |
| CineFlow | Concise location → content query → showtime state progression. | Mock schedule; ticket count is ignored. |
| WebMCP Maze | Partial observability, inventory/blockers and distinct intro/gameplay/game-over tool surfaces; bounded worker isolates optional code evaluation. | Still a game; several schemas and compute bounds are incomplete. |

These demos make two things non-negotiable for our build: tool availability
must reflect real state, and the native tool path must be tested separately
from any in-app simulator or ordinary buttons.

## Angular official integration guidance

The [Angular WebMCP guide](https://angular.dev/ai/webmcp) demonstrates app,
route, service/component and implicit Signal Form registration through
experimental APIs. Dependency injection and route cleanup are valuable, but
the API is explicitly experimental; JSON Schema does not automatically enforce
runtime values; some model values cannot be inferred; async validators do not
run in implicit forms; name collisions throw; and the live guide/source showed
an auto-cleanup naming drift at inspection time.

For a deadline build with no existing framework project, this supports using a
small direct registration adapter and explicit validation instead of adopting a
new framework only for syntactic convenience.

## The resulting bar for our project

The smallest credible winning loop is approximately:

```text
inspect exact shared state
→ audit or simulate without mutation
→ stage a bounded candidate against revision N
→ human changes or protects one irreducible decision
→ agent replans only what is unlocked
→ human grants exact, digest-bound authority
→ commit with revalidation and idempotency
→ independently verify revision N+1
→ export an editable artifact plus certificate
```

It should use roughly four to seven state-aware tools, demonstrate one real
capability transition, one rejected stale/adversarial path, one human-only
decision, one objective before/after invariant and one zero-login resettable
fixture. Approval, undo, receipts and dynamic registration are required craft;
the domain transformation is what must remain novel.
