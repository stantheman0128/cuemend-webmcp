# CueMend YouTube Publish Package

Status: the local media package is ready, but no public YouTube video exists
yet. Selecting local files requires a manual handoff, and the final public
`Publish` action requires explicit user confirmation at action time. This
document is not publication evidence.

## Files to select

- Video master: `C:\Users\stans\Projects\WebMCP\artifacts\demo-cloud\cuemend-webmcp-demo.mp4`
- Custom thumbnail: `C:\Users\stans\Projects\WebMCP\artifacts\demo-cloud\cuemend-video-thumbnail.jpg`
- English captions: `C:\Users\stans\Projects\WebMCP\docs\verification\cuemend-youtube-captions.srt`

Use the phrase-level captions above instead of the eight scene-length blocks
generated with the build artifact. Its 43 cue starts were timed from
SAPI-reported word positions in one matching-voice alignment pass. The
replacement keeps the complete narration in non-overlapping cues, uses at most
two lines per cue, keeps its longest line to 42 characters, stays at or below
16.9 characters per second, and ends before the 169.916-second master.

## Title

CueMend — Human-Guided Caption Timing with WebMCP

## Description

CueMend is a browser-native rehearsal room where humans protect the dramatic beats that make a performance feel human, while an agent exhaustively repairs caption timing.

In this demo, the agent audits a fictional 32-second rehearsal, evaluates 6,561 bounded tracks, stages non-mutating alternatives, safely refuses a stale revision after the stage manager protects an actor’s breath, and commits only after exact human approval. The final editable WebVTT and limitations certificate are bound to the committed revision with SHA-256 digests.

WebMCP integration: CueMend registers phase-aware inspect, audit, stage, preview, discard, commit, and verify/export tools directly in the page. Human approval exposes a one-shot commit tool; stale state removes preview while preserving safe discard and replan actions; commit retires mutation tools.

Terminology note: “256 legal tracks” in the narration means 256 feasible candidates under CueMend Demo Theatre Profile v1—not legal, accessibility, broadcast, venue, or artistic certification.

Live app: https://stantheman0128.github.io/cuemend-webmcp/

Public source: https://github.com/stantheman0128/cuemend-webmcp

Built for The WebMCP Challenge.

The rehearsal data is fictional. CueMend Demo Theatre Profile v1 is an explicit demonstration profile, not universal accessibility, broadcast, legal, venue, or artistic certification.

Chapters
0:00 Result first
0:14 Why human authority matters
0:37 Native WebMCP audit and staging
1:03 Protect the actor’s breath
1:22 Stale request refused
1:41 Exact human approval
2:02 One-shot commit
2:25 Verify and export

## Studio settings

- Audience: `No, it's not made for kids`
- Video language: `English`
- Visibility: `Public`
- Playlist: omit unless the user chooses one
- Paid promotion, altered content, and other optional declarations: answer
  truthfully in Studio; do not infer them from this package

## Verification gates

Before using the watch URL in Devpost, verify in an anonymous browser that:

- the video opens without authentication and says `Public`;
- YouTube's final transcode remains under three minutes;
- narration is audible and the custom thumbnail is present;
- English captions can be enabled and track the narration;
- both description links open the live app and public repository.

The public URL should then replace `PENDING_VIDEO` in the submission package.
