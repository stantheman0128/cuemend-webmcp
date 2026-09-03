# Devpost Field Matrix

Live requirements fetched from The WebMCP Challenge on 2026-09-04. This is a
submission handoff, not proof that the draft is Submitted.

| Field ID | Required answer | Prepared value | Evidence / boundary |
| --- | --- | --- | --- |
| `28249` | Submitter Type | `PENDING_USER_CONFIRMATION` | Devpost offers Individual, Team of Individuals, or Organization. Do not infer this from sole authorship. |
| `28250` | Country of residence | `PENDING_USER_CONFIRMATION` | Multi-select country field. Do not infer residence from timezone, language, or current location. |
| `28251` | Organization name | Omit unless the user selects Organization | Optional. |
| `28252` | App Status | `New` | Repository history and project records show the challenge build was created during the submission period. |
| `28253` | Existing-project changes | Omit | Not applicable when App Status is New. |
| `28254` | Live URL | `https://stantheman0128.github.io/cuemend-webmcp/` | Public, no account or credentials required. |
| `28255` | Testing instructions | Open the live URL in a WebMCP-enabled ChatGPT in-app browser or supported Chrome build. Confirm **WebMCP ready**, click **Copy judge prompt**, and send it to the browser agent. The ordinary UI is the fallback. | Native Chrome CDP run and ordinary-UI run are archived in `docs/verification/`. |
| `28256` | Public code repo | `https://github.com/stantheman0128/cuemend-webmcp` | Public repository with top-level MIT license. |
| `28257` | Tested agent/client | `Chrome 151.0.7922.175 via the native CDP WebMCP domain; ordinary UI fallback in the same browser with WebMCP disabled.` | Three repeat native runs plus one full ordinary-UI run. |
| `28258` | AI tools used | `OpenAI Codex for official-rule research, competitive analysis, ideation, adversarial selection, implementation, testing, verification, and documentation.` | No generative model runs inside the submitted app. |
| `28259` | Learning level | `Significant` | The build produced concrete lessons about state-aware capabilities, stale-revision refusal, runtime validation, human authority, and evidence-backed claims. |
| `28260` | Career AI value | `Yes` | The project developed reusable patterns for agent-safe browser collaboration and verification. |

## Formal-submit gate

Before calling Devpost's submit action, the user must explicitly confirm the
official rules and platform terms in this conversation, supply field `28249`,
and supply field `28250`. The final response must be checked for the literal
status `Submitted`; a draft URL alone is not completion evidence.
