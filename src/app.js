import { createCueMendStore, CueMendError } from "./commands.js";
import { auditTrack } from "./engine.js";
import { attachCueMendWebMcp } from "./webmcp.js";

const store = createCueMendStore();

const byId = (id) => document.getElementById(id);
const elements = {
  runtimeBadge: byId("runtime-badge"),
  runtimeLabel: byId("runtime-label"),
  copyPromptButton: byId("copy-prompt-button"),
  resetButton: byId("reset-button"),
  revision: byId("revision-value"),
  phase: byId("phase-badge"),
  conflicts: byId("metric-conflicts"),
  conflictsNote: byId("metric-conflicts-note"),
  cps: byId("metric-cps"),
  beatsMetric: byId("metric-beats"),
  stageScene: byId("stage-scene"),
  projection: byId("projection-title"),
  actorMara: byId("actor-mara"),
  actorJon: byId("actor-jon"),
  beatNow: byId("beat-now"),
  beatNowLabel: byId("beat-now-label"),
  captionOverlay: byId("caption-overlay"),
  captionSpeaker: byId("caption-speaker"),
  captionText: byId("caption-text"),
  stageTrackLabel: byId("stage-track-label"),
  baselineView: byId("baseline-view"),
  proposalView: byId("proposal-view"),
  playButton: byId("play-button"),
  playIcon: byId("play-icon"),
  currentTime: byId("current-time"),
  scrubber: byId("time-scrubber"),
  speedButton: byId("speed-button"),
  timeline: byId("timeline"),
  playhead: byId("playhead"),
  beatControls: byId("beat-controls"),
  actionTitle: byId("action-title"),
  actionCopy: byId("action-copy"),
  actionButtons: byId("action-buttons"),
  stepCount: byId("step-count"),
  issuesCount: byId("issues-count"),
  issueList: byId("issue-list"),
  proposalStatus: byId("proposal-status"),
  proposalContent: byId("proposal-content"),
  activityList: byId("activity-list"),
  toolInventory: byId("tool-inventory"),
  toast: byId("toast"),
};

const issueNames = {
  cue_overlap: "Cue overlap",
  cue_gap: "Tight cue gap",
  cue_too_short: "Duration",
  reading_rate: "Reading rate",
  speaker_missing: "Speaker identity",
  protected_beat: "Protected beat",
  reserved_region: "Visual collision",
};

let snapshot = store.getSnapshot();
let previewPlanId = null;
let previewProposalId = null;
let lastPreviewSerial = 0;
let viewMode = "active";
let playTime = 0;
let playbackSpeed = 1;
let animationFrame = null;
let previousFrameTime = null;
let inventory = { supported: false, names: [] };
let toastTimer = null;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${remainder
    .toFixed(1)
    .padStart(4, "0")}`;
}

function showToast(message, isError = false) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.toggle("is-error", isError);
  elements.toast.classList.add("is-visible");
  toastTimer = setTimeout(() => {
    elements.toast.classList.remove("is-visible");
  }, 3800);
}

async function safely(action, successMessage) {
  try {
    const result = await action();
    if (successMessage) showToast(successMessage);
    return result;
  } catch (error) {
    const message =
      error instanceof CueMendError
        ? `${error.code}: ${error.message}`
        : error instanceof Error
          ? error.message
          : String(error);
    showToast(message, true);
    return null;
  }
}

function currentInternalPlan() {
  const internal = store.getInternalState();
  if (!internal.proposal || internal.proposal.id !== previewProposalId) return null;
  return (
    internal.proposal.plans.find((plan) => plan.id === previewPlanId) ??
    internal.proposal.plans[0] ??
    null
  );
}

function displayedTrack() {
  const plan = viewMode === "proposal" ? currentInternalPlan() : null;
  return {
    cues: plan?.cues ?? snapshot.cues,
    audit:
      plan?.audit ??
      auditTrack({
        cues: snapshot.cues,
        beats: snapshot.beats,
        profile: snapshot.profile,
        reservedRegions: snapshot.reservedRegions,
      }),
    label: plan ? `STAGED · ${plan.label.toUpperCase()}` : "ACTIVE TRACK",
  };
}

function renderStage() {
  const track = displayedTrack();
  const activeCues = track.cues
    .filter((cue) => cue.start <= playTime && cue.end > playTime)
    .sort((left, right) => left.start - right.start);
  const cue = activeCues.at(-1);
  const activeBeat = snapshot.beats.find(
    (beat) => beat.start <= playTime && beat.end > playTime,
  );

  elements.projection.classList.toggle(
    "is-visible",
    snapshot.reservedRegions.some(
      (region) => region.start <= playTime && region.end > playTime,
    ),
  );
  elements.actorMara.classList.toggle("is-speaking", cue?.speaker.startsWith("MARA"));
  elements.actorJon.classList.toggle("is-speaking", cue?.speaker.startsWith("JON"));
  elements.beatNow.hidden = !activeBeat;
  if (activeBeat) {
    elements.beatNowLabel.textContent = `${activeBeat.locked ? "Protected" : "Optional"} · ${activeBeat.label}`;
  }

  elements.captionOverlay.className = `caption-overlay position-${cue?.position ?? "bottom"}`;
  if (cue) {
    elements.captionSpeaker.textContent = cue.speaker || "SPEAKER NOT IDENTIFIED";
    elements.captionText.textContent = cue.text;
  } else {
    elements.captionSpeaker.textContent = activeBeat
      ? activeBeat.label.toUpperCase()
      : "REHEARSAL SPACE";
    elements.captionText.textContent = activeBeat
      ? "The room gets this moment without text."
      : "No caption at this timecode.";
  }
  elements.stageTrackLabel.textContent = track.label;
  elements.currentTime.textContent = formatTime(playTime);
  elements.scrubber.value = String(playTime);
  elements.scrubber.style.setProperty(
    "--scrub",
    `${(playTime / snapshot.profile.durationSeconds) * 100}%`,
  );
  positionPlayhead();
}

function positionPlayhead() {
  const width = elements.timeline.clientWidth;
  const left = 17 + (playTime / snapshot.profile.durationSeconds) * width;
  elements.playhead.style.left = `${left}px`;
}

function renderTimeline() {
  const { cues, audit } = displayedTrack();
  const duration = snapshot.profile.durationSeconds;
  const issuesByCue = new Map();
  for (const finding of audit.issues) {
    for (const cueId of finding.cueIds) {
      issuesByCue.set(cueId, (issuesByCue.get(cueId) ?? 0) + 1);
    }
  }

  elements.timeline.replaceChildren();
  for (const second of [0, 8, 16, 24, 32]) {
    const tick = document.createElement("span");
    tick.className = "timeline-tick";
    tick.style.left = `${(second / duration) * 100}%`;
    tick.textContent = `${second}s`;
    elements.timeline.append(tick);
  }

  for (const cue of cues) {
    const block = document.createElement("div");
    const errorCount = issuesByCue.get(cue.id) ?? 0;
    block.className = `cue-block ${errorCount ? "has-error" : audit.ok ? "is-clean" : ""}`;
    block.style.left = `${(cue.start / duration) * 100}%`;
    block.style.width = `${((cue.end - cue.start) / duration) * 100}%`;
    block.title = `${cue.id} · ${cue.start.toFixed(2)}–${cue.end.toFixed(2)}s · ${cue.speaker || "missing speaker"}`;
    block.innerHTML = `<span>${escapeHtml(cue.id.replace("cue-", "C"))}</span>${
      errorCount ? `<i class="cue-error-count">${errorCount}</i>` : ""
    }`;
    elements.timeline.append(block);
  }

  for (const beat of snapshot.beats) {
    const block = document.createElement("div");
    block.className = `beat-block ${beat.locked ? "" : "is-optional"}`;
    block.style.left = `${(beat.start / duration) * 100}%`;
    block.style.width = `${Math.max(((beat.end - beat.start) / duration) * 100, 0.7)}%`;
    block.title = `${beat.locked ? "Protected" : "Optional"}: ${beat.label}`;
    elements.timeline.append(block);
  }
  positionPlayhead();
}

function renderBeatControls() {
  elements.beatControls.innerHTML = snapshot.beats
    .map(
      (beat) => `
        <button
          class="beat-control ${beat.locked ? "is-locked" : ""}"
          type="button"
          data-beat-id="${escapeHtml(beat.id)}"
          aria-pressed="${beat.locked}"
          ${snapshot.phase === "committed" ? "disabled" : ""}
        >
          <span class="beat-lock-icon" aria-hidden="true">${beat.locked ? "◆" : "◇"}</span>
          <span class="beat-copy">
            <strong>${escapeHtml(beat.label)}</strong>
            <small>${escapeHtml(beat.detail)}</small>
          </span>
          <span class="beat-state">${beat.locked ? "LOCKED" : "OPTIONAL"}</span>
        </button>`,
    )
    .join("");

  for (const button of elements.beatControls.querySelectorAll("[data-beat-id]")) {
    button.addEventListener("click", () =>
      safely(
        () =>
          store.dispatch(
            "toggleBeatLock",
            {
              beatId: button.dataset.beatId,
              expectedRevision: snapshot.workspaceRevision,
            },
            "HUMAN",
          ),
        button.getAttribute("aria-pressed") === "true"
          ? "Artistic beat released."
          : "Beat protected. Any older proposal is now stale.",
      ),
    );
  }
}

function renderIssues() {
  elements.issuesCount.textContent = String(snapshot.audit.issueCount);
  if (!snapshot.audit.issueCount) {
    elements.issueList.innerHTML = `
      <div class="clean-state">
        <span aria-hidden="true">✓</span>
        <strong>Track verifies cleanly</strong>
        <span>0 conflicts under the named demo profile.</span>
      </div>`;
    return;
  }
  elements.issueList.innerHTML = snapshot.audit.issues
    .map(
      (finding, index) => `
        <article class="issue-item">
          <span class="issue-index">${String(index + 1).padStart(2, "0")}</span>
          <div>
            <span class="issue-type">${escapeHtml(issueNames[finding.type] ?? finding.type)}</span>
            <p class="issue-message">${escapeHtml(finding.message)}</p>
          </div>
        </article>`,
    )
    .join("");
}

function displayPreview(proposalId, planId) {
  previewProposalId = proposalId;
  previewPlanId = planId;
  viewMode = "proposal";
}

function requestPreview(proposalId, planId) {
  return safely(
    () =>
      store.dispatch(
        "previewTimingPlan",
        { proposalId, planId },
        "HUMAN",
      ),
    "Staged A/B preview is visible. The active track is unchanged.",
  );
}

function renderProposal() {
  const proposal = snapshot.proposal;
  if (!proposal) {
    elements.proposalStatus.textContent = "None";
    elements.proposalContent.className = "empty-state";
    elements.proposalContent.innerHTML = `
      <span aria-hidden="true">⌁</span>
      <p>No agent proposal yet. Active captions stay untouched.</p>`;
    return;
  }

  if (proposal.stale) {
    elements.proposalStatus.textContent = "Stale";
    elements.proposalContent.className = "";
    elements.proposalContent.innerHTML = `
      <div class="stale-card">
        <strong>Revision changed under this proposal.</strong>
        <span>Bound to r${proposal.baseRevision}; the room is now r${snapshot.workspaceRevision}. CueMend will not preview, approve, or apply it.</span>
      </div>
      <div class="action-buttons" style="margin-top: 9px">
        <button class="button button-primary" type="button" data-restage>Replan current revision</button>
        <button class="button button-quiet" type="button" data-discard>Discard stale plan</button>
      </div>`;
    elements.proposalContent.querySelector("[data-restage]").addEventListener("click", () =>
      safely(
        () =>
          store.dispatch(
            "stageTimingPlan",
            { expectedRevision: snapshot.workspaceRevision },
            "HUMAN",
          ),
        "Replanned against the human's new beat lock.",
      ),
    );
    elements.proposalContent.querySelector("[data-discard]").addEventListener("click", () =>
      safely(
        () =>
          store.dispatch(
            "discardTimingPlan",
            { proposalId: proposal.id },
            "HUMAN",
          ),
        "Stale proposal discarded; active captions were untouched.",
      ),
    );
    return;
  }

  elements.proposalStatus.textContent =
    snapshot.phase === "committed"
      ? "Committed proof"
      : snapshot.phase === "approved"
        ? "Human approved"
        : "Staged only";
  elements.proposalContent.className = "";
  const proposalIsReadOnly = snapshot.phase === "committed";
  const planCards = proposal.plans
    .map(
      (plan) => `
        <article class="plan-card ${proposal.selectedPlanId === plan.id ? "is-selected" : ""} ${proposalIsReadOnly ? "is-committed" : ""}" data-plan-card="${escapeHtml(plan.id)}">
          <div class="plan-title-row">
            <strong>${escapeHtml(plan.label)}</strong>
            <span class="plan-id">${escapeHtml(plan.id)}</span>
          </div>
          <div class="plan-metrics">
            <span>0 conflicts</span>
            <span>${plan.cost.changedCueCount} cues</span>
            <span>${plan.cost.timingMovementMs}ms motion</span>
          </div>
          ${
            proposalIsReadOnly
              ? '<div class="plan-committed-label">Recorded in commit receipt</div>'
              : `<div class="action-buttons" style="margin-top: 8px">
                  <button class="button button-quiet" type="button" data-preview-plan="${escapeHtml(plan.id)}">Preview A/B</button>
                  <button class="button ${proposal.selectedPlanId === plan.id ? "button-primary" : "button-quiet"}" type="button" data-select-plan="${escapeHtml(plan.id)}">
                    ${proposal.selectedPlanId === plan.id ? "Selected" : "Select"}
                  </button>
                </div>`
          }
        </article>`,
    )
    .join("");
  const approval = proposalIsReadOnly
    ? ""
    : snapshot.approval
    ? `<div class="approval-strip">Human approval <code>${escapeHtml(snapshot.approval.digest.slice(0, 12))}</code> binds this exact plan and revision.</div>`
    : proposal.selectedPlanId
      ? `<button class="button button-primary button-wide" type="button" data-approve style="margin-top: 9px">Approve exact selected plan</button>`
      : `<div class="proposal-summary"><span>Selecting is a human-only artistic decision.</span></div>`;
  const receipt = snapshot.receipt
    ? `<div class="receipt-card"><strong>✓ Commit receipt</strong><span>${escapeHtml(snapshot.receipt.beforeIssueCount)} → ${escapeHtml(snapshot.receipt.afterIssueCount)} conflicts · r${escapeHtml(snapshot.receipt.priorRevision)} → r${escapeHtml(snapshot.receipt.workspaceRevision)}</span><span><code>${escapeHtml(snapshot.receipt.trackDigest.slice(0, 20))}…</code></span></div>`
    : "";
  elements.proposalContent.innerHTML = `
    <div class="proposal-summary">
      <span><strong>${proposal.evaluatedCount.toLocaleString("en-US")}</strong> tracks evaluated</span>
      <span><strong>${proposal.feasibleCount.toLocaleString("en-US")}</strong> feasible</span>
    </div>
    <div class="plan-list">${planCards}</div>
    ${approval}
    ${receipt}`;

  for (const button of elements.proposalContent.querySelectorAll("[data-preview-plan]")) {
    button.addEventListener("click", () =>
      requestPreview(proposal.id, button.dataset.previewPlan),
    );
  }
  for (const button of elements.proposalContent.querySelectorAll("[data-select-plan]")) {
    button.addEventListener("click", () =>
      safely(
        () =>
          store.dispatch(
            "selectPlan",
            { proposalId: proposal.id, planId: button.dataset.selectPlan },
            "HUMAN",
          ),
        "Alternative selected. It is still staged—not approved.",
      ),
    );
  }
  elements.proposalContent.querySelector("[data-approve]")?.addEventListener("click", () =>
    safely(
      () => store.dispatch("approveSelectedPlan", { proposalId: proposal.id }, "HUMAN"),
      "Exact plan approved. A one-shot commit tool is now available.",
    ),
  );
}

function makeButton(label, className, listener) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.addEventListener("click", listener);
  return button;
}

function renderActionPanel() {
  elements.actionButtons.replaceChildren();
  const stage = () =>
    safely(
      () =>
        store.dispatch(
          "stageTimingPlan",
          { expectedRevision: snapshot.workspaceRevision },
          "HUMAN",
        ),
      "Bounded search complete. Active captions are still untouched.",
    );
  const audit = () =>
    safely(
      () => store.dispatch("auditCaptions", {}, "HUMAN"),
      `${snapshot.audit.issueCount} reproducible conflicts found.`,
    );

  switch (snapshot.phase) {
    case "baseline":
      elements.stepCount.textContent = "01";
      elements.actionTitle.textContent = "Audit the active track";
      elements.actionCopy.textContent =
        "Read the exact revision, then turn every constraint failure into a reproducible cue-level finding.";
      elements.actionButtons.append(
        makeButton("Run deterministic audit", "button button-primary", audit),
        makeButton("Stage repair plan", "button button-quiet", stage),
      );
      break;
    case "proposed":
      elements.stepCount.textContent = "02";
      elements.actionTitle.textContent = "The plan is staged—not applied";
      elements.actionCopy.textContent =
        "Preview the candidate. If Jon's optional breath matters, protect it: the old plan will become safely stale.";
      elements.actionButtons.append(
        makeButton("Preview plan 1", "button button-primary", () =>
          requestPreview(snapshot.proposal.id, snapshot.proposal.plans[0].id),
        ),
      );
      if (!snapshot.beats.find((beat) => beat.id === "beat-breath")?.locked) {
        elements.actionButtons.append(
          makeButton("Protect Jon's breath", "button button-quiet", () =>
            safely(
              () =>
                store.dispatch(
                  "toggleBeatLock",
                  {
                    beatId: "beat-breath",
                    expectedRevision: snapshot.workspaceRevision,
                  },
                  "HUMAN",
                ),
              "Human constraint added. The proposal is now stale by design.",
            ),
          ),
        );
      }
      break;
    case "stale":
      elements.stepCount.textContent = "03";
      elements.actionTitle.textContent = "The human changed the brief";
      elements.actionCopy.textContent =
        "The proposal still proves what it was bound to, but it cannot touch revision " +
        snapshot.workspaceRevision +
        ". Replan instead of silently overwriting the new beat lock.";
      elements.actionButtons.append(
        makeButton("Replan revision " + snapshot.workspaceRevision, "button button-primary", stage),
      );
      break;
    case "approved":
      elements.stepCount.textContent = "04";
      elements.actionTitle.textContent = "Approval is exact and live";
      elements.actionCopy.textContent =
        "The human approved one plan digest. A browser agent can now use the one-shot commit capability; ordinary UI remains available.";
      elements.actionButtons.append(
        makeButton("Apply approved plan (UI)", "button button-primary", () =>
          safely(
            () =>
              store.dispatch(
                "commitApprovedPlan",
                { requestId: createRequestId("ui") },
                "HUMAN",
              ),
            "Approved caption plan committed with an immutable receipt.",
          ),
        ),
      );
      break;
    case "committed":
      elements.stepCount.textContent = "05";
      elements.actionTitle.textContent = snapshot.lastVerification
        ? "Verified, portable, still editable"
        : "Verify the committed artifact";
      elements.actionCopy.textContent = snapshot.lastVerification
        ? "The active track re-audits at zero conflicts. Download the editable WebVTT and its explicit limitations certificate."
        : "Re-audit the committed track independently, then bind WebVTT and certificate to SHA-256 digests.";
      elements.actionButtons.append(
        makeButton(
          snapshot.lastVerification ? "Download evidence pack" : "Verify & build evidence pack",
          "button button-primary",
          async () => {
            let verification = snapshot.lastVerification;
            if (!verification) {
              verification = await safely(
                () => store.dispatch("verifyAndExport", {}, "HUMAN"),
                "Verified: 0 conflicts. Evidence pack is ready.",
              );
            }
            if (verification) downloadEvidence(verification);
          },
        ),
      );
      break;
    default:
      break;
  }
}

function renderActivity() {
  elements.activityList.innerHTML = snapshot.activity
    .slice(-6)
    .map(
      (item) => `
        <article class="activity-item" data-actor="${escapeHtml(item.actor)}">
          <span class="activity-actor">${escapeHtml(item.actor)}</span>
          <strong>${escapeHtml(item.action)}</strong>
          <span>${escapeHtml(item.detail)}</span>
        </article>`,
    )
    .join("");
  elements.activityList.scrollLeft = elements.activityList.scrollWidth;
}

function renderInventory() {
  if (!inventory.supported) {
    elements.toolInventory.innerHTML = '<span class="tool-chip">ordinary UI mode</span>';
    return;
  }
  elements.toolInventory.innerHTML = inventory.names
    .map(
      (name) => `<span class="tool-chip" title="${escapeHtml(name)}">${escapeHtml(name.replace("cuemend_", ""))}</span>`,
    )
    .join("");
}

function renderViewSwitch() {
  const proposalAvailable = Boolean(
    snapshot.phase !== "committed" && snapshot.proposal && !snapshot.proposal.stale,
  );
  if (!proposalAvailable && viewMode === "proposal") viewMode = "active";
  elements.proposalView.disabled = !proposalAvailable;
  elements.baselineView.classList.toggle("is-active", viewMode === "active");
  elements.proposalView.classList.toggle("is-active", viewMode === "proposal");
}

function render(nextSnapshot) {
  snapshot = nextSnapshot;
  let appliedNewPreview = false;
  if (!snapshot.preview) {
    lastPreviewSerial = 0;
  } else if (
    snapshot.preview.serial !== lastPreviewSerial &&
    snapshot.phase !== "committed" &&
    snapshot.proposal &&
    !snapshot.proposal.stale
  ) {
    lastPreviewSerial = snapshot.preview.serial;
    displayPreview(snapshot.preview.proposalId, snapshot.preview.planId);
    appliedNewPreview = true;
  }
  if (!snapshot.proposal) {
    previewPlanId = null;
    previewProposalId = null;
    viewMode = "active";
  } else if (snapshot.proposal.id !== previewProposalId) {
    previewProposalId = snapshot.proposal.id;
    previewPlanId = snapshot.proposal.selectedPlanId ?? snapshot.proposal.plans[0]?.id ?? null;
  } else if (snapshot.proposal.selectedPlanId && !appliedNewPreview) {
    previewPlanId = snapshot.proposal.selectedPlanId;
  }

  elements.revision.textContent = String(snapshot.workspaceRevision);
  elements.phase.textContent = snapshot.phase.toUpperCase();
  elements.phase.dataset.phase = snapshot.phase;
  elements.conflicts.textContent = String(snapshot.audit.issueCount);
  elements.conflictsNote.textContent = snapshot.audit.issueCount
    ? snapshot.audit.issueCount === 1
      ? "needs repair"
      : "need repair"
    : "verified clean";
  elements.cps.textContent = snapshot.audit.metrics.maxCharactersPerSecond.toFixed(1);
  elements.beatsMetric.textContent = String(snapshot.audit.metrics.protectedBeatCount);
  renderViewSwitch();
  renderStage();
  renderTimeline();
  renderBeatControls();
  renderIssues();
  renderProposal();
  renderActionPanel();
  renderActivity();
  renderInventory();
}

function tick(timestamp) {
  if (previousFrameTime === null) previousFrameTime = timestamp;
  const elapsed = ((timestamp - previousFrameTime) / 1000) * playbackSpeed;
  previousFrameTime = timestamp;
  playTime = Math.min(snapshot.profile.durationSeconds, playTime + elapsed);
  renderStage();
  if (playTime >= snapshot.profile.durationSeconds) {
    stopPlayback();
    return;
  }
  animationFrame = requestAnimationFrame(tick);
}

function startPlayback() {
  if (animationFrame) return;
  if (playTime >= snapshot.profile.durationSeconds) playTime = 0;
  previousFrameTime = null;
  elements.playIcon.textContent = "❚❚";
  elements.playButton.setAttribute("aria-label", "Pause rehearsal");
  animationFrame = requestAnimationFrame(tick);
}

function stopPlayback() {
  if (animationFrame) cancelAnimationFrame(animationFrame);
  animationFrame = null;
  previousFrameTime = null;
  elements.playIcon.textContent = "▶";
  elements.playButton.setAttribute("aria-label", "Play rehearsal");
}

function createRequestId(prefix) {
  const suffix = globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID().replaceAll("-", "").slice(0, 18)
    : `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return `${prefix}-${suffix}`;
}

function downloadFile(name, type, content) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function downloadEvidence(verification) {
  downloadFile("cuemend-the-listening-city.vtt", "text/vtt", verification.vtt);
  downloadFile(
    "cuemend-certificate.json",
    "application/json",
    JSON.stringify(verification.certificate, null, 2),
  );
  showToast("Downloaded editable WebVTT and the verification certificate.");
}

function judgePrompt() {
  if (snapshot.phase === "approved") {
    return "Use CueMend's currently available WebMCP tools. Commit the exact human-approved plan with requestId demo-commit-001, then verify and export it. Report the final issue count and the first 12 characters of each digest.";
  }
  if (snapshot.phase === "committed") {
    return "Use CueMend's WebMCP tools to inspect the committed rehearsal, independently verify it, and summarize what the certificate proves and explicitly does not claim.";
  }
  if (snapshot.phase === "stale") {
    return `The human protected a new artistic beat and the old proposal is stale. Inspect CueMend revision ${snapshot.workspaceRevision}, explain why the old plan cannot be used, stage a new zero-conflict plan, and preview plan-1. Stop before any human-only selection or approval.`;
  }
  return "Use CueMend's WebMCP tools to inspect the rehearsal, audit the active captions, stage a zero-conflict timing plan against the exact current revision, and preview plan-1. Do not select, approve, or commit anything; stop so the human stage manager can protect artistic beats and choose.";
}

elements.playButton.addEventListener("click", () => {
  if (animationFrame) stopPlayback();
  else startPlayback();
});

elements.scrubber.addEventListener("input", () => {
  playTime = Number(elements.scrubber.value);
  renderStage();
});

elements.speedButton.addEventListener("click", () => {
  playbackSpeed = playbackSpeed === 1 ? 2 : 1;
  elements.speedButton.textContent = `${playbackSpeed}×`;
});

elements.baselineView.addEventListener("click", () => {
  viewMode = "active";
  renderViewSwitch();
  renderStage();
  renderTimeline();
});

elements.proposalView.addEventListener("click", () => {
  if (!snapshot.proposal || snapshot.proposal.stale) return;
  viewMode = "proposal";
  previewProposalId = snapshot.proposal.id;
  previewPlanId = snapshot.proposal.selectedPlanId ?? snapshot.proposal.plans[0].id;
  renderViewSwitch();
  renderStage();
  renderTimeline();
});

elements.resetButton.addEventListener("click", () =>
  safely(async () => {
    stopPlayback();
    playTime = 0;
    viewMode = "active";
    await store.dispatch("reset", {}, "HUMAN");
  }, "Rehearsal reset to the deterministic seven-conflict fixture."),
);

elements.copyPromptButton.addEventListener("click", () =>
  safely(async () => {
    const prompt = judgePrompt();
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(prompt);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = prompt;
      document.body.append(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
  }, "Copied a state-aware judge prompt."),
);

window.addEventListener("resize", positionPlayhead);
window.addEventListener("beforeunload", stopPlayback);

store.subscribe(render);
render(snapshot);

const webMcpAdapter = await attachCueMendWebMcp({
  store,
  onInventory(nextInventory) {
    inventory = nextInventory;
    if (nextInventory.error) {
      elements.runtimeBadge.dataset.state = "error";
      elements.runtimeLabel.textContent = "WebMCP registration error";
      elements.runtimeBadge.title = nextInventory.error;
    } else if (nextInventory.supported) {
      elements.runtimeBadge.dataset.state = "ready";
      elements.runtimeLabel.textContent = `WebMCP ready · ${nextInventory.names.length} tools`;
      elements.runtimeBadge.title = nextInventory.names.join("\n");
    } else {
      elements.runtimeBadge.dataset.state = "fallback";
      elements.runtimeLabel.textContent = "Standard UI mode";
      elements.runtimeBadge.title = nextInventory.message ?? "WebMCP unavailable";
    }
    renderInventory();
  },
});

await webMcpAdapter.ready;
window.addEventListener("beforeunload", () => webMcpAdapter.stop());
