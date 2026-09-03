# CueMend Demo Script

Target: 2:35–2:45, public YouTube, English narration. The recording must show a
real WebMCP-capable browser and audible narration. Do not substitute a scripted
agent simulator for the native tool calls.

## Preflight

- Start from a clean anonymous load at revision 1.
- Place ChatGPT beside CueMend so tool calls and visible page state can both be
  seen without zooming below legibility.
- Confirm the header says **WebMCP ready** and exposes the base tool inventory.
- Prepare the state-aware prompt with CueMend's **Copy judge prompt** button.
- Record system audio only if needed; narration must be clearly audible.
- Keep the final cut below 2:55 to leave a safe duration margin.

## Shot and narration plan

### 0:00–0:12 — Show the result first

**Picture:** Three-second before/after jump: seven red conflicts, then a clean
timeline, `0 conflicts`, verification certificate and downloadable WebVTT.

**Narration:**

“This is CueMend. A human protects the moments that make a performance feel
human; a browser agent repairs thousands of caption-timing possibilities and
proves the exact track it changed.”

### 0:12–0:32 — Name the problem and authority split

**Picture:** Reset. Scrub across the audience laugh and lighting reveal. Point
to the two locked beat controls and seven cue-level findings.

**Narration:**

“Small theatre and school teams can spend a rehearsal chasing overlaps,
reading speed and captions that cover a projection. Automation can check those
constraints, but it should not decide whether a laugh, reveal or actor's breath
needs silence. CueMend makes that boundary part of the product.”

### 0:32–1:02 — Real WebMCP inspect, audit and stage

**Picture:** Paste the copied prompt. Show the agent discover and call
`cuemend_get_rehearsal`, `cuemend_audit_captions` and
`cuemend_stage_timing_plan`. Keep the visible page in frame as alternatives
appear.

**Narration:**

“Through WebMCP, the page exposes exact cue IDs, timings, protected beats and
workspace revision—not pixels or a caption-file blob. The agent audits the live
track, enumerates all 6,561 authored combinations, and stages three
zero-conflict alternatives. Staging never touches the active track.”

### 1:02–1:34 — Human changes the brief; stale plan fails

**Picture:** Preview plan 1 over Jon's optional breath. Click **Protect Jon's
final breath**. Show revision 2, eight conflicts and **Stale**. Ask the agent to
try the old preview or explain it, then replan.

**Narration:**

“The cheapest plan crosses Jon's final breath. Only I, the stage manager, can
protect that artistic beat. The revision changes immediately, the old proposal
becomes stale, and CueMend refuses to reuse it. The agent must replan under my
new constraint instead of silently overwriting it.”

### 1:34–2:05 — Exact human approval and dynamic capability

**Picture:** Agent previews the new plan. Human selects plan 1 and clicks
**Approve exact selected plan**. Show the tool inventory gain
`cuemend_commit_approved_plan`; have the agent commit it with a stable request
ID. Show the receipt and clean timeline.

**Narration:**

“I compare the new A/B track, select one alternative and approve its exact
revision and SHA-256 digest. Only now does a one-shot commit capability appear.
The handler rechecks the plan, locks and profile before mutation, and the same
visible state updates whether a person or agent acts.”

### 2:05–2:34 — Verify, export and limitations

**Picture:** Agent calls `cuemend_verify_and_export`. Show zero conflicts,
digests, protected beats and the downloaded `.vtt` plus certificate. End on the
stage playing the clean track.

**Narration:**

“A final tool independently re-audits the committed captions, exports editable
WebVTT, and binds the track and certificate to digests. The certificate says
exactly what it proves—and what it does not. This is a transparent demo theatre
profile, not universal accessibility certification. CueMend is the collaboration:
the agent does the exhaustive work, while the human keeps the beat.”

## Final video verification

- [x] Result appears in the first 10–12 seconds.
- [x] Native tool discovery and at least three real calls are legible.
- [x] Human lock, stale rejection and dynamic commit tool are visible.
- [x] Final state is genuinely zero conflicts after a clean reset.
- [x] Local-master narration is audible and the duration is under three minutes (169.916 seconds).
- [ ] Final YouTube transcode remains under three minutes.
- [ ] Video is public, not unlisted/private, and opens without authentication.
- [ ] Description links the live app and public source repository.
