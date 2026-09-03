# Official WebMCP Challenge Audit

Evidence cutoff: 2026-09-04 around 01:40 Asia/Taipei. Official data was read through the Devpost Hackathons integration and cross-checked against first-party Devpost, OpenAI, Chrome, WebMCP specification, and GoogleChromeLabs pages.

## At a glance

- Event: **The WebMCP Challenge**, hosted by OpenAI.
- Theme: build a WebMCP-powered web app that explores an open web where people and agents interact, collaborate, and create together. The app should become meaningfully better when both use it.
- Registration: the connected Devpost account is already registered.
- Current live deadline: **2026-09-04 01:00 PT = 08:00 UTC = 16:00 Asia/Taipei**. This is a 12-hour outage extension and supersedes older page copy that still shows the original deadline.
- Judging: 2026-09-04 10:00 PT through 2026-09-21 17:00 PT; winners expected around 2026-09-23 14:00 PT.
- Prizes: ten winners, with an official cash award of USD 3,500 each plus sponsor benefits listed on the event page.

Primary sources: [challenge home](https://webmcp.devpost.com/), [rules](https://webmcp.devpost.com/rules), [resources](https://webmcp.devpost.com/resources), [deadline extension](https://webmcp.devpost.com/updates/46227-deadline-extension-12-more-hours), [OpenAI challenge page](https://openai.com/webmcp-challenge/).

## Formal judging model

### Stage 1 — pass/fail viability gate

A project must reasonably fit the theme and reasonably apply the required APIs/SDKs. In practical terms, the deployed website must expose genuine working WebMCP tools and show at least one non-trivial agent workflow. A README snippet or ordinary LLM/API call is not evidence that the gate is passed.

### Stage 2 — four equally weighted criteria

1. **WebMCP Leverage** — thorough, skillful, working, non-trivial use of WebMCP.
2. **Execution** — a runnable, coherent product experience, not merely a technical proof of concept.
3. **Potential Impact** — a credible, specific real problem and audience, with the demonstrated solution actually addressing it.
4. **Creativity & Ambition** — novel concept and meaningful difference from existing concepts.

Ties are resolved in the listed order, so WebMCP Leverage is the first tie-breaker, then Execution, Impact, and Creativity/Ambition.

## Required submission package

- A working live URL accessible in ChatGPT's in-app browser or a WebMCP-enabled Chrome build.
- A public GitHub, GitLab, or Bitbucket repository containing the actual WebMCP registration/integration code, schemas, source/assets, complete run instructions, and an open-source license detected visibly at repository level.
- A **public YouTube** video under three minutes, with audio, showing the product functioning and explaining what was built and how WebMCP was used.
- English submission materials, or an English translation.
- Testing credentials/instructions if authentication is required.
- Required form fields including submitter type, country, app status, live URL, repository URL, tested agents/clients, AI tools used, learning, and career-value answers.
- All teammates must have accepted invitations. The entry must be `Submitted`, not only saved as a draft.

The project must stay free, public, accessible, and function as depicted throughout judging. Official update guidance says not to change the submission, repository, video, or live site after the deadline.

## Originality, third parties, and existing work

- New work is encouraged. If a project existed before August 25, only the meaningful WebMCP extension built during the submission period is judged; dated commits should make the boundary obvious.
- Third-party code, APIs, datasets, media, trademarks, and music must be lawfully used.
- Multiple entries are allowed only when substantially different; an entrant will not win more than once. The organizer explicitly recommends concentrating on one excellent demonstration when time is short.

## Official Updates — complete 5/5 index

1. [Deadline Extension | 12 more hours](https://webmcp.devpost.com/updates/46227-deadline-extension-12-more-hours) — live deadline moved to September 4 at 01:00 PT because of the outage.
2. [The deadline is tomorrow](https://webmcp.devpost.com/updates/46162-the-deadline-is-tomorrow) — test from a clean session; ensure public repo/license/video; stay live through judging; verify `Submitted`.
3. [2 days left, and what judges actually look for](https://webmcp.devpost.com/updates/46161-2-days-left-and-what-judges-actually-look-for) — show the result in the first 10–15 seconds, center the film on real tool calls, and explain the four WebMCP fit questions concretely.
4. [Halfway there. Where are you?](https://webmcp.devpost.com/updates/46123-halfway-there-where-are-you) — tool discovery/call, end-to-end flow, deployment, public licensed repo, and video script should all exist early.
5. [6 days left to build](https://webmcp.devpost.com/updates/46116-6-days-left-to-build) — start from a real problem, test in a capable browser early, and document pre-existing versus challenge-period work.

## Discussions — complete 12/12 ledger

1. [Desktop outage / deadline](https://webmcp.devpost.com/forum_topics/45065-chatgpt-desktop-is-down-can-we-extend-the-deadline) — manager confirmed the 12-hour extension.
2. [Video requirement conflict](https://webmcp.devpost.com/forum_topics/45044-demo-video-requirement-conflicting-faq-information) — video is mandatory; live URL, public licensed repository, and video are all required. Judges may judge from materials without testing the site.
3. [Pre-existing open-source boundary](https://webmcp.devpost.com/forum_topics/45024-question-on-the-open-source-repo-requirement-for-pre-existing-projects) — no direct manager answer in that thread.
4. [Cloudflare credit issue](https://webmcp.devpost.com/forum_topics/45014-cloudflare-credit-issue) — redirected to sponsor support; credits are not guaranteed infrastructure.
5. [Enforced code snippet?](https://webmcp.devpost.com/forum_topics/45006-enforced-code-snippet-requested) — `registerTool`/`search_products` text is an example, not a required literal; abstractions are allowed if they register real working WebMCP tools.
6. [Production dataset](https://webmcp.devpost.com/forum_topics/45004-must-a-public-repo-include-the-full-production-dataset-for-an-existing-webmcp-app) — representative fixtures are acceptable when sufficient to run and evaluate the project, if documented clearly.
7. [Chrome plugin version issue](https://webmcp.devpost.com/forum_topics/44998-chatgpt-chrome-plugin-latest-version-issue) — manager suggested testing the deployed URL and ChatGPT in-app browser; thread links the complete Taboo game submission.
8. [Consumer browser extension eligibility](https://webmcp.devpost.com/forum_topics/44989-does-a-browser-extension-that-consumes-webmcp-tools-qualify-or-must-the-submission-be-a-web-app-that-exposes-them) — unanswered; do not base the architecture on this interpretation.
9. [Netlify/Vercel credit issues](https://webmcp.devpost.com/forum_topics/44988-netlify-and-vercel-credits-issues) — unanswered.
10. [Private pre-existing backend](https://webmcp.devpost.com/forum_topics/44963-can-a-pre-existing-proprietary-hosted-backend-remain-private) — allowed if every challenge-period WebMCP tool/integration/schema/setup component is public and the private service is clearly identified as an external dependency.
11. [Private dependencies](https://webmcp.devpost.com/forum_topics/44950-are-private-repo-dependencies-allowed) — conditionally allowed with rights and runnable stubs/workarounds; the WebMCP implementation itself may not be hidden.
12. [Multiple submissions](https://webmcp.devpost.com/forum_topics/44943-clarification-on-submission-limit-one-entry-per-entrant) — allowed when unique and substantially different; focus on one if time is tight.

At the evidence cutoff, the official project-gallery page was inspected in the authenticated browser and still displayed: “The hackathon managers haven't published this gallery yet.” Search-indexed individual submission pages and public videos therefore provide the usable competitive sample, not an official complete gallery.

## First-party implementation findings

A separate source-level review of all linked OpenAI showcase apps, the 16
GoogleChromeLabs runnable demos, Cloudflare coffee-store, the Vercel/Shopify
version split and Angular's experimental integration is in
[`official-showcase-audit.md`](official-showcase-audit.md). Its central finding
is that tool count is not the bar: the official examples reward orthogonal
domain verbs, one canonical human/agent state, capability lifecycle, visible
postconditions and editable/exportable artifacts.

Sources: [build tools](https://developer.chrome.com/docs/ai/webmcp/build-tools), [best practices](https://developer.chrome.com/docs/ai/webmcp/best-practices), [imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api), [declarative API](https://developer.chrome.com/docs/ai/webmcp/declarative-api), [secure tools](https://developer.chrome.com/docs/ai/webmcp/secure-tools), [agent security](https://developer.chrome.com/docs/agents/security), [evals](https://developer.chrome.com/docs/ai/webmcp/evals), [draft specification](https://webmachinelearning.github.io/webmcp/).

- Prefer 4–7 atomic, composable tools whose outputs feed later calls over a `do_everything` tool. Tool availability may change with UI state, but avoid re-registering on every render.
- WebMCP's distinctive value is tab-bound, ephemeral access to the page's current session and visible UI state. A remote API wrapper leaves much of that advantage unused.
- Current imperative registration uses `document.modelContext.registerTool(...)`. Registration-lifetime cancellation and per-execution cancellation are separate; an unregistered tool may still have in-flight work, so every commit must recheck current state and idempotency.
- Current annotations include `readOnlyHint` and `untrustedContentHint`; they are metadata, not enforcement. Input schemas are not a security boundary and handlers must validate strictly.
- Do not depend on proposed/unshipped `outputSchema`, elicitation, request-user-interaction, consequential-action hints, progress/streaming, or worker-persistent tools.
- Use small app-level error envelopes for expected business failures; reserve thrown failures for actual programming/security faults because browser error semantics are thin.
- The strongest consequential-action design is: read/simulate → stage → show exact diff/digest → human UI issues a short-lived one-use token bound to that digest → commit revalidates authorization, state freshness, limits, and idempotency.
- Treat user-generated/vendor content and tool output as hostile. The visible UI and direct WebMCP path must share the same deterministic business rules.
- Eval evidence should distinguish: local selection/argument tests, browser-executed live calls, deterministic post-state assertions, and adversarial tests. Passing a mock/smoke harness alone does not prove safety or end-to-end behavior.
- DevTools' WebMCP panel can show registered tools, invocation counts, inputs/outputs, completion/cancellation/errors, and schema problems—useful film evidence when balanced with visible product behavior.
- Deploy via HTTPS with feature detection and an ordinary human UI fallback. Test the exact target Chrome/in-app runtime; the draft is evolving and is not a stable W3C standard.

## Hard go/no-go checklist

The final project is not ready unless all are true:

- [x] Deployed page exposes discoverable WebMCP tools.
- [x] A real agent completes the critical multi-tool path from a clean session.
- [x] Human actions and tool calls share one command/state engine and update the visible UI.
- [x] Expected failures are recoverable; stale/mutated confirmation is rejected.
- [ ] At least one adversarial or failure branch is filmed and tested.
- [x] Live URL works anonymously and stays stable.
- [x] Public repository contains actual code, setup, license, and fixtures.
- [ ] Public YouTube video is under three minutes, has audio, and opens with a working result—not a logo sequence.
- [x] Devpost text explicitly explains WebMCP fit, UX improvement, novel human-agent ability, and implementation.
- [ ] Entry is visibly `Submitted` before the deadline, then all artifacts are frozen.

## A note on accuracy

This guide is a helper, and if it ever disagrees with the Devpost website, the website prevails.
