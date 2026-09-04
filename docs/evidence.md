# CueMend Verification Ledger

This ledger distinguishes authored contracts from observed execution. A blank
or pending row is deliberately not a pass.

| Layer | Evidence required | Status | Artifact |
| --- | --- | --- | --- |
| Engine | Seven baseline issues and 6,561 evaluated tracks | Passed 2026-09-04 05:22 +08:00 | `node --test tests/engine.test.js` — 5/5 |
| Engine | Fresh post-lock search returns a zero-conflict plan | Passed 2026-09-04 05:22 +08:00 | `tests/engine.test.js` |
| Invariants | Dialogue and protected beat definitions stay byte-identical | Passed 2026-09-04 05:22 +08:00 | `tests/engine.test.js` |
| Authority | Stale revision, no approval and wrong actor are rejected | Passed 2026-09-04 05:22 +08:00 | `node --test tests/commands.test.js` — 6/6 |
| Commit | Stable request ID is idempotent and receipt-bound | Passed 2026-09-04 05:22 +08:00 | `tests/commands.test.js` |
| WebMCP | Tool inventories change across all four phases | Passed 2026-09-04 05:22 +08:00 | `node --test tests/webmcp.test.js` — 6/6 |
| Static app | Full automated suite passes | Passed 2026-09-04 08:15 +08:00 | GitHub Actions run `33821005303`; clean Ubuntu/Node 20 checkout; `npm test` — 19/19, 0 failed |
| Static server | Homepage/module/favicon delivery, CSP, methods, encoded slash/backslash traversal and 404 behavior | Passed 2026-09-04 07:21 +08:00 | `tests/server.test.js` — 1/1 on Windows and Linux CI |
| Source hygiene | No placeholder, stale name or hidden network-capable API in app/test/server scope | Passed 2026-09-04 05:23 +08:00 | Focused `rg` checks; only documented links, data-SVG and local server URLs remain |
| Clean clone | Public repository checkout independently passes the full suite | Passed 2026-09-04 08:15 +08:00 | GitHub Actions run `33821005303` on `970ffb148e5b058ece263cf8da83dfe29d8e395b`; Ubuntu clean checkout; 19/19, 0 failed |
| Ordinary UI | Clean reset journey, transport, keyboard, reduced motion and split-width layout work in a standard browser | Passed 2026-09-04 06:04 +08:00 | Chrome 151; `ordinary-browser-verification.json`; baseline/final/split screenshots |
| Native WebMCP | Native browser WebMCP multi-tool journey completes | Passed 2026-09-04 06:04 +08:00 | Chrome 151 CDP `WebMCP`; `webmcp-browser-verification.json`; 10 native calls per run |
| Native WebMCP | Real stale attempt is rejected and safely recovered | Passed 2026-09-04 06:04 +08:00 | Old revision 1 stage returned `STALE_REVISION` in each live run; state stayed r2/stale/8 |
| Repeatability | Three clean-reset live runs succeed | Passed 2026-09-04 06:04 +08:00 | 3/3 runs: baseline r1/7 → stale r2/8 → committed r3/0 |
| Deployment | Anonymous HTTPS load matches the public repository | Passed 2026-09-04 08:16 +08:00 | Pages run `33821004554` on `970ffb148e5b058ece263cf8da83dfe29d8e395b`; cache-busted index/favicon/WebMCP module returned 200 and matched local bytes/SHA-256 |
| Video master | Result-first cut, native-browser execution evidence, audible narration and duration under three minutes | Passed 2026-09-04 07:16 +08:00 | Actions run `33816454390`; 169.916 s; 1280×720 H.264/AAC; SHA-256 `96ba8a62…300f2`; `demo-video-evidence.json` |
| Caption sidecar | Complete, readable SRT stays within the master and is content-digest bound | Passed 2026-09-04 08:13 +08:00 | `node --test tests/captions.test.js` — 1/1; 43 SAPI-word-timed cues; 0 overlaps; max 16.9 CPS |
| Video delivery | Public YouTube URL opens without authentication and remains under three minutes after transcode | Blocked on human file selection/publication | Local master: `artifacts/demo-cloud/cuemend-webmcp-demo.mp4` |
| Devpost | Required fields complete and status says `Submitted` | Blocked on user confirmation | Devpost URL/status |

## Commands to capture

```powershell
node --test tests/engine.test.js
node --test tests/commands.test.js
node --test tests/webmcp.test.js
npm test
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\run-browser-verification.ps1
```

The browser verifier records the exact browser/protocol versions, discovered
tool inventories, invocation IDs, bounded result summaries, visible post-state,
responsive/keyboard checks and browser diagnostics. Its native pass calls the
Chrome DevTools Protocol `WebMCP.invokeTool` command directly; it is separate
from the mocked registration contract tests.
