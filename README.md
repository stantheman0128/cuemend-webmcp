# CueMend

> Repair the timing. Keep the beat.

CueMend is a browser-native rehearsal room where a human stage manager protects
the moments that carry a performance and an agent repairs the remaining caption
timing through WebMCP. The result stays visible, editable and verifiable.

Built for [The WebMCP Challenge](https://webmcp.devpost.com/).

**[Open the live CueMend rehearsal](https://stantheman0128.github.io/cuemend-webmcp/)**

## Why this needs both a person and an agent

A solver can check thousands of timing combinations; it cannot decide whether
an actor's breath, an audience laugh or a lighting reveal is artistically
important. CueMend gives each side the authority it is actually good at:

- the human locks artistic beats, compares alternatives and approves one exact
  plan;
- the agent inspects structured state, audits ten cues, enumerates all 6,561
  authored timing combinations, and stages zero-conflict alternatives;
- an approved plan becomes a temporary, one-shot WebMCP capability;
- commit revalidates the exact revision and SHA-256-bound plan before mutation;
- independent verification exports editable WebVTT plus an explicit limitations
  certificate.

The page also works as an ordinary UI. Both paths call the same command layer
and update the same visible artifact.

## The two-minute judge journey

1. Open CueMend: revision 1 has ten cues, two protected beats and seven
   deliberately independent conflicts.
2. Ask the browser agent to inspect, audit and stage a plan. The active track is
   unchanged while three A/B alternatives appear.
3. Preview plan 1. It crosses Jon's optional final breath.
4. As the human, click **Protect Jon's breath**. Revision 2 now has eight
   conflicts and the old proposal is visibly stale.
5. Ask the agent to replan revision 2 and preview plan 1. Select and approve the
   exact alternative in the UI.
6. The dynamically available commit tool can now apply only that approved plan.
7. Ask the agent to verify and export. CueMend reports zero conflicts and binds
   the WebVTT, track and certificate to SHA-256 digests.

The **Copy judge prompt** button always produces the right bounded instruction
for the current phase.

## WebMCP tools

CueMend registers tools with the current
[`document.modelContext.registerTool`](https://webmachinelearning.github.io/webmcp/)
API and retires registrations with `AbortSignal` when capabilities change.

| Phase | Tools available to the agent |
| --- | --- |
| Base | `cuemend_get_rehearsal`, `cuemend_audit_captions`, `cuemend_stage_timing_plan` |
| Staged | Base tools plus `cuemend_preview_timing_plan` and `cuemend_discard_timing_plan` |
| Human approved | Staged tools plus one-shot `cuemend_commit_approved_plan` |
| Committed | Read tools plus `cuemend_verify_and_export`; mutation tools retire |

Tool metadata is descriptive, not trusted enforcement. Every execution repeats
strict argument, phase, identifier and revision validation inside the canonical
command layer. Errors are bounded structured results with a safe next action.

## Run locally

Requirements: Node.js 20 or newer. There are no package dependencies, accounts,
API keys, builds or environment files.

```bash
npm run serve
```

Open `http://127.0.0.1:4173`. Without a WebMCP-enabled browser, the badge reads
**Standard UI mode** and the complete human flow still works.

Run the deterministic contract suite:

```bash
npm test
```

## Architecture

```text
index.html              semantic application shell
styles.css             responsive theatre visual system
src/fixture.js         fictional cues, beats, repair variants and demo profile
src/engine.js          pure audit/search, WebVTT and digest helpers
src/commands.js        revision, approval and idempotency state machine
src/webmcp.js          feature-detected dynamic WebMCP adapter
src/app.js             visible stage, timeline, playback and UI actions
tests/                 deterministic engine, command and tool contracts
scripts/serve.mjs      dependency-free local static server
docs/                  product contract, evidence and demo materials
research/              official audit, 100 ideas and selection tournament
```

The solver is deliberately inspectable: eight cues each have three authored
variants, so the exact search space is `3^8 = 6,561`. It ranks valid tracks by
changed cue count, timing movement, semantic changes and a stable lexical key.
It never invents or rewrites dialogue.

## Truthful scope

All rehearsal dialogue and production details are fictional and rights-safe.
Everything runs locally in the tab; no caption, cue or approval data is sent to
a server.

`CueMend Demo Theatre Profile v1` is an explicit demonstration profile—not a
universal accessibility, WCAG, broadcast, venue, legal or artistic standard.
The certificate proves only that the committed fixture re-audits under its
named rules and that exported artifacts match the recorded digests. See
[`docs/product-spec.md`](docs/product-spec.md) for the frozen contract.

## License

[MIT](LICENSE)
