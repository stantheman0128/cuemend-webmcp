# CueMend — Devpost Submission Draft

Status: Devpost project `1416114` / submission `1169845` exists as a draft.
The live URL, source URL and tested-client evidence are verified; the public
video is still pending. This file is not evidence that the entry is Submitted.

## Project name

CueMend

## Tagline

Repair the timing. Keep the beat.

## One-line summary

A WebMCP rehearsal room where humans protect dramatic beats, agents
exhaustively repair caption timing, and every committed WebVTT track is
revision-bound and verifiable.

## Inspiration

Caption timing is both mechanical and artistic. A tool can detect overlap,
reading-rate and placement conflicts, but a performance's important silences
are not generic optimization targets. A laugh needs room; a reveal may need a
clear screen; an actor's breath can be part of the story. We built CueMend to
show a form of human-agent collaboration where the human contributes genuine
authority and taste while the agent performs exhaustive, inspectable work.

Small theatres, school productions and live-event teams are the audience we
designed for: people who need systematic caption checks but cannot delegate a
performance's meaning to an optimizer. CueMend gives the agent exhaustive
comparison work while the stage manager retains artistic judgment and the
final commit decision. Unlike a chat wrapper or one-shot fixer, the human's
taste becomes revisioned page state that invalidates old agent work and changes
which WebMCP actions exist.

## What it does

CueMend opens a fictional 32-second rehearsal with ten caption cues and seven
independent conflicts. A browser agent can inspect the exact cue graph, audit
the active revision, enumerate 6,561 authored timing combinations and stage up
to three zero-conflict alternatives. The active captions remain unchanged
until a person has compared and approved one exact plan.

The signature moment happens when the cheapest staged plan crosses Jon's
optional final breath. The stage manager protects that beat in the visible UI.
CueMend increments the revision, marks the old proposal stale and refuses to
preview or apply it. The agent replans under the new human constraint. After the
human selects and approves an exact digest, a temporary commit tool appears.
The committed result is independently re-audited and exported as editable
WebVTT with a SHA-256-bound certificate and explicit limitations.

## How we used WebMCP

CueMend uses WebMCP as a page-owned semantic collaboration surface—not as a
shortcut to a remote API. The app registers small tools over the same live
state shown in its stage, cue rail, issue cards and activity log:

- inspect the current rehearsal and exact revision;
- deterministically audit active captions;
- stage an exhaustive bounded repair plan;
- preview or discard an exact proposal;
- commit only a plan approved in the human UI;
- verify and export only after commit.

Tool availability follows the state machine. A fresh proposal exposes preview
and discard tools. When that proposal becomes stale, preview retires while safe
discard and replan actions remain. The one-shot commit capability appears only
after human approval, and mutation tools retire after commit. Registrations are
removed with an `AbortSignal`. Every handler repeats runtime validation because
schemas and annotations are not treated as security boundaries.

Without WebMCP, an agent sees pixels or receives an opaque caption file. With
WebMCP, CueMend can expose cue IDs, current locks, revision-bound alternatives,
structured evidence and safe next actions while the human sees every state
transition in the ordinary product UI.

**Native execution proof.** We exercised this exact journey three times from a
clean reset in Chrome 151 through the browser's native CDP `WebMCP` domain, with
10 native tool calls per run. Every run produced a genuine `STALE_REVISION`
refusal, recovered safely, and finished at revision 3 with zero conflicts.
Machine-readable traces and screenshots are archived in `docs/verification/`;
a separate ordinary-UI run reached the same product result.

## How we built it

CueMend is a dependency-free static application using semantic HTML,
responsive CSS and native ES modules. A pure JavaScript engine audits interval,
duration, reading-rate, speaker, protected-beat and reserved-region rules. It
enumerates an exact `3^8 = 6,561` search space and sorts valid tracks by a
transparent cost tuple.

A canonical command layer owns revision checks, typed error recovery, human-only
operations, proposal/plan digests, idempotent request IDs and immutable commit
receipts. Both ordinary buttons and WebMCP handlers dispatch into this same
layer. Node's built-in test runner covers engine, authority and tool-lifecycle
contracts without third-party packages.

## Challenges we ran into

The hardest design problem was making human approval substantive. A generic
“approve” button would not demonstrate collaboration, so the person instead
changes the optimization problem by protecting a new artistic beat. That
action must invalidate an in-flight proposal reliably, yet remain legible in a
short demo.

The evolving WebMCP API also requires careful separation between registration
lifetime cancellation and execution cancellation. We designed registrations
to change only when the capability inventory changes, and revalidate all
consequential state immediately before commit.

## Accomplishments that we're proud of

- A human decision causes a real agent replan, not a cosmetic approval step.
- The engine evaluates every candidate in its disclosed finite search space.
- An old proposal cannot be previewed, approved or committed after a human lock
  or revision change.
- Commit is bound to the selected plan, current locks, profile and revision.
- One request ID applies at most once and returns the same receipt on replay.
- The final artifact is editable WebVTT, not a result trapped in chat.
- The visible app remains fully usable when WebMCP is unavailable.

## What we learned

The most useful WebMCP tools are domain verbs over live, visible state. Tool
count matters less than orthogonality, clear postconditions and recoverable
errors. Dynamic registration becomes especially meaningful when it mirrors real
authority: the browser agent should not even see a commit capability until a
person has approved the exact artifact.

We also learned to make every numeric claim auditable. CueMend names its demo
profile, returns the exact number of candidates evaluated, preserves dialogue,
and places limitations beside the certificate instead of implying universal
caption compliance.

## What's next

After the challenge, CueMend could support user-authored production profiles,
real caption import, additional visual safe areas and rehearsal-note exchange.
Those extensions should preserve the same principle: automation proposes and
proves mechanical changes, while production teams retain control over artistic
intent.

## Important limitations

The built-in dialogue and rehearsal are fictional. The named CueMend Demo
Theatre Profile is a transparent product fixture, not a universal WCAG,
broadcast, venue, legal or artistic standard. CueMend does not claim to certify
accessibility or replace professional caption review.

## Links

- Live app: https://stantheman0128.github.io/cuemend-webmcp/
- Public source: https://github.com/stantheman0128/cuemend-webmcp
- Public YouTube demo: `PENDING_VIDEO`
- Video duration: 2:49.916 local master; final YouTube duration still requires verification
- YouTube publish package: `docs/youtube-publish-package.md`
- Phrase-level English captions: `docs/verification/cuemend-youtube-captions.srt`
- Tested clients: Chrome 151.0.7922.175 with the native CDP `WebMCP` domain; ordinary UI fallback in the same browser with WebMCP disabled
- Devpost draft: https://devpost.com/software/cuemend (submission `1169845`, not yet Submitted)

## Testing instructions

No account or credentials are required. Open the live URL in a WebMCP-enabled
ChatGPT in-app browser or supported Chrome build. Confirm the header says
**WebMCP ready**, click **Copy judge prompt**, and send that prompt to the
browser agent. The button adapts its instruction to the current phase. The
entire ordinary UI also works without WebMCP.

For an ordinary-browser fallback, verify these visible checkpoints in order:
**r1 / 7 conflicts** → **Protect Jon's breath** → **r2 / 8 conflicts + Stale**
→ **Replan revision 2** → select plan 1 → **Approve exact selected plan** →
**Apply approved plan (UI)** → **r3 / 0 conflicts** → **Verify & build evidence
pack**.

## Technology and AI disclosures

- WebMCP imperative API
- HTML, CSS, JavaScript ES modules, Web Crypto and WebVTT
- Node.js built-in test runner and dependency-free static server
- OpenAI Codex was used for official-rule research, competitive analysis,
  ideation, adversarial selection, implementation, testing and documentation.
- No generative model runs inside the submitted app; its repair engine is
  deterministic and local to the browser.

## Submission-form facts to confirm

- Submitter type: `PENDING_USER_CONFIRMATION`
- Country of residence: `PENDING_USER_CONFIRMATION`
- App status / pre-existing work: new project created during the challenge
- Repository license: MIT
- Authentication credentials: none
- Team / invitation status: `PENDING_USER_CONFIRMATION`; before submission,
  verify that the selected Submitter Type matches Devpost and that every listed
  teammate, if any, has accepted the invitation
- Formal rules acknowledgement: required from the user before submission
- Final `Submitted` state: must be checked live before the deadline
