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
generated with the build artifact. The replacement preserves the complete
narration in 47 non-overlapping cues, uses at most two lines per cue, keeps its
longest line to 42 characters, and ends before the 169.916-second master.

## Title

CueMend — Human-Guided Caption Timing with WebMCP

## Description

CueMend is a browser-native rehearsal room where humans protect the dramatic beats that make a performance feel human, while an agent exhaustively repairs caption timing.

In this demo, the agent audits a fictional 32-second rehearsal, evaluates 6,561 bounded tracks, stages non-mutating alternatives, safely refuses a stale revision after the stage manager protects an actor’s breath, and commits only after exact human approval. The final editable WebVTT and limitations certificate are bound to the committed revision with SHA-256 digests.

Live app: https://stantheman0128.github.io/cuemend-webmcp/

Public source: https://github.com/stantheman0128/cuemend-webmcp

Built for The WebMCP Challenge.

The rehearsal data is fictional. CueMend Demo Theatre Profile v1 is an explicit demonstration profile, not universal accessibility, broadcast, legal, venue, or artistic certification.

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
