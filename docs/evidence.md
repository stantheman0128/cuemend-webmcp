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
| Static app | Full automated suite passes | Passed 2026-09-04 06:02 +08:00 | `npm test` — 18/18, 0 failed, 675.813 ms |
| Static server | Homepage/module/favicon delivery, CSP, methods, encoded Windows traversal and 404 behavior | Passed 2026-09-04 06:02 +08:00 | `tests/server.test.js` — 1/1 |
| Source hygiene | No placeholder, stale name or hidden network-capable API in app/test/server scope | Passed 2026-09-04 05:23 +08:00 | Focused `rg` checks; only documented links, data-SVG and local server URLs remain |
| Clean clone | Public repository clone is clean and independently passes the full suite | Passed 2026-09-04 05:28 +08:00 | Remote HEAD `1965fe13c12bbca928edb26b459b7259bb18802c`; 18/18, 0 failed |
| Ordinary UI | Clean reset journey, transport, keyboard, reduced motion and split-width layout work in a standard browser | Passed 2026-09-04 06:04 +08:00 | Chrome 151; `ordinary-browser-verification.json`; baseline/final/split screenshots |
| Native WebMCP | Real browser agent completes the critical multi-tool journey | Passed 2026-09-04 06:04 +08:00 | Chrome 151 CDP `WebMCP`; `webmcp-browser-verification.json`; 10 native calls per run |
| Native WebMCP | Real stale attempt is rejected and safely recovered | Passed 2026-09-04 06:04 +08:00 | Old revision 1 stage returned `STALE_REVISION` in each live run; state stayed r2/stale/8 |
| Repeatability | Three clean-reset live runs succeed | Passed 2026-09-04 06:04 +08:00 | 3/3 runs: baseline r1/7 → stale r2/8 → committed r3/0 |
| Deployment | Anonymous HTTPS load matches the public repository | Passed 2026-09-04 06:04 +08:00 | Pages build `2b7534a894aa98b8cbdc1138df9d5ce03142ecd2`; index/favicon 200; browser diagnostics 0/0/0 |
| Video master | Result-first cut, real native-browser evidence, audible narration, captions and duration under three minutes | Passed 2026-09-04 07:16 +08:00 | Actions run `33816454390`; 169.916 s; 1280×720 H.264/AAC; SHA-256 `96ba8a62…300f2`; `demo-video-evidence.json` |
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
