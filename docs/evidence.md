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
| Static app | Full automated suite passes | Passed 2026-09-04 05:25 +08:00 | `npm test` — 18/18, 0 failed, 481.796 ms |
| Static server | Homepage/module delivery, CSP, methods, encoded Windows traversal and 404 behavior | Passed 2026-09-04 05:25 +08:00 | `tests/server.test.js` — 1/1 |
| Source hygiene | No placeholder, stale name or hidden network-capable API in app/test/server scope | Passed 2026-09-04 05:23 +08:00 | Focused `rg` checks; only documented links, data-SVG and local server URLs remain |
| Ordinary UI | Clean reset journey completes in a standard browser | Pending | screenshot/run note |
| Native WebMCP | Real agent completes the critical multi-tool journey | Pending | client transcript/screenshot |
| Native WebMCP | Real stale attempt is rejected and safely recovered | Pending | client transcript/screenshot |
| Repeatability | Three clean-reset live runs succeed | Pending | run notes |
| Deployment | Anonymous HTTPS load matches the public repository | Pending | URLs/commit SHA |
| Video | Public, audible and under three minutes | Pending | YouTube URL/duration |
| Devpost | Required fields complete and status says `Submitted` | Blocked on user confirmation | Devpost URL/status |

## Commands to capture

```powershell
node --test tests/engine.test.js
node --test tests/commands.test.js
node --test tests/webmcp.test.js
npm test
```

After deployment, record the exact commit SHA, response headers and timestamp.
For browser evidence, record the client/version, the discovered tool names,
inputs, structured outputs and visible post-state. A mocked registration test
does not satisfy the native WebMCP rows.
