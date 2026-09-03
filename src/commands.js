import { createInitialWorkspace } from "./fixture.js";
import {
  auditTrack,
  buildCertificate,
  exportWebVtt,
  searchTimingPlans,
  sha256Hex,
  stableStringify,
  summarizePlan,
} from "./engine.js";

export class CueMendError extends Error {
  constructor(code, message, nextAction, details = {}) {
    super(message);
    this.name = "CueMendError";
    this.code = code;
    this.nextAction = nextAction;
    this.details = details;
  }

  toJSON() {
    return {
      ok: false,
      error: {
        code: this.code,
        message: this.message,
        nextAction: this.nextAction,
        details: this.details,
      },
    };
  }
}

function clone(value) {
  return structuredClone(value);
}

function assertActor(actor, allowed, action) {
  if (!allowed.includes(actor)) {
    throw new CueMendError(
      "HUMAN_AUTHORITY_REQUIRED",
      `${action} is reserved for the human stage manager in the visible app.`,
      "Ask the human to use the on-screen control, then inspect the updated rehearsal.",
      { actor, allowed },
    );
  }
}

function assertRevision(state, expectedRevision) {
  if (!Number.isInteger(expectedRevision)) {
    throw new CueMendError(
      "INVALID_REVISION",
      "expectedRevision must be an integer from the current rehearsal snapshot.",
      "Call cuemend_get_rehearsal and retry with its workspaceRevision.",
    );
  }
  if (expectedRevision !== state.workspaceRevision) {
    throw new CueMendError(
      "STALE_REVISION",
      `Proposal expected revision ${expectedRevision}, but the workspace is revision ${state.workspaceRevision}.`,
      "Call cuemend_get_rehearsal, re-audit, and stage a new timing plan.",
      { expectedRevision, currentRevision: state.workspaceRevision },
    );
  }
}

function assertPhase(state, allowed, action) {
  if (!allowed.includes(state.phase)) {
    throw new CueMendError(
      "INVALID_PHASE",
      `${action} is not available while CueMend is ${state.phase}.`,
      state.phase === "committed"
        ? "Inspect or verify the committed track, or ask the human to reset the demo."
        : "Inspect the current rehearsal and follow its safe next action.",
      { phase: state.phase, allowed },
    );
  }
}

function assertProposal(state, proposalId) {
  if (!state.proposal) {
    throw new CueMendError(
      "NO_PROPOSAL",
      "There is no staged timing proposal.",
      "Call cuemend_stage_timing_plan first.",
    );
  }
  if (proposalId && proposalId !== state.proposal.id) {
    throw new CueMendError(
      "PROPOSAL_MISMATCH",
      `Proposal ${proposalId} is not the current staged proposal.`,
      "Inspect the current rehearsal and use its proposal ID.",
      { currentProposalId: state.proposal.id },
    );
  }
  if (
    state.proposal.stale ||
    state.proposal.baseRevision !== state.workspaceRevision
  ) {
    throw new CueMendError(
      "STALE_REVISION",
      `The staged proposal is bound to revision ${state.proposal.baseRevision}, but the workspace is revision ${state.workspaceRevision}.`,
      "Discard or replace the stale proposal by staging a new plan against the current revision.",
      {
        proposalId: state.proposal.id,
        proposalRevision: state.proposal.baseRevision,
        currentRevision: state.workspaceRevision,
      },
    );
  }
  return state.proposal;
}

function publicPlan(plan, baselineCues) {
  return {
    id: plan.id,
    label: plan.label,
    digest: plan.digest,
    cost: plan.cost,
    metrics: plan.audit.metrics,
    changes: summarizePlan(baselineCues, plan),
  };
}

function publicProposal(proposal, baselineCues) {
  if (!proposal) return null;
  return {
    id: proposal.id,
    digest: proposal.digest,
    baseRevision: proposal.baseRevision,
    stale: proposal.stale,
    evaluatedCount: proposal.search.evaluatedCount,
    feasibleCount: proposal.search.feasibleCount,
    selectedPlanId: proposal.selectedPlanId,
    plans: proposal.plans.map((plan) =>
      publicPlan(plan, proposal.baselineCues ?? baselineCues),
    ),
  };
}

function publicSnapshot(state) {
  const audit = auditTrack({
    cues: state.cues,
    beats: state.beats,
    profile: state.profile,
    reservedRegions: state.reservedRegions,
  });
  return {
    product: "CueMend",
    phase: state.phase,
    workspaceRevision: state.workspaceRevision,
    profile: clone(state.profile),
    cues: clone(state.cues),
    beats: clone(state.beats),
    reservedRegions: clone(state.reservedRegions),
    audit,
    proposal: publicProposal(state.proposal, state.cues),
    preview: clone(state.preview),
    approval: state.approval
      ? {
          proposalId: state.approval.proposalId,
          planId: state.approval.planId,
          digest: state.approval.digest,
          baseRevision: state.approval.baseRevision,
        }
      : null,
    receipt: clone(state.receipt),
    lastVerification: clone(state.lastVerification),
    activity: clone(state.activity),
  };
}

export function createCueMendStore(seed = createInitialWorkspace()) {
  let state = clone(seed);
  const listeners = new Set();

  function emit() {
    const snapshot = publicSnapshot(state);
    for (const listener of listeners) listener(snapshot);
  }

  function record(actor, action, detail) {
    state.activity.push({
      id: `activity-${String(state.activity.length + 1).padStart(3, "0")}`,
      actor,
      action,
      detail,
    });
    state.activity = state.activity.slice(-18);
  }

  async function stageTimingPlan({ expectedRevision }, actor) {
    assertPhase(
      state,
      ["baseline", "proposed", "stale", "approved"],
      "Staging a timing plan",
    );
    assertRevision(state, expectedRevision);
    const search = searchTimingPlans({
      cues: state.cues,
      beats: state.beats,
      profile: state.profile,
      reservedRegions: state.reservedRegions,
      maxPlans: 3,
    });
    if (!search.plans.length) {
      throw new CueMendError(
        "NO_FEASIBLE_PLAN",
        "No authored timing combination satisfies the current protected beats and demo profile.",
        "Review the highlighted smallest conflicts with the human stage manager.",
        {
          evaluatedCount: search.evaluatedCount,
          feasibleCount: search.feasibleCount,
        },
      );
    }

    const plans = [];
    for (const plan of search.plans) {
      plans.push({
        ...plan,
        digest: await sha256Hex({
          baseRevision: state.workspaceRevision,
          cues: plan.cues,
          cost: plan.cost,
          variantIds: plan.variantIds,
        }),
      });
    }
    const proposalCore = {
      baseRevision: state.workspaceRevision,
      evaluatedCount: search.evaluatedCount,
      feasibleCount: search.feasibleCount,
      plans: plans.map(({ id, digest }) => ({ id, digest })),
    };
    const digest = await sha256Hex(proposalCore);
    state.proposal = {
      id: `proposal-${digest.slice(0, 12)}`,
      digest,
      baseRevision: state.workspaceRevision,
      stale: false,
      baselineCues: clone(state.cues),
      search: {
        evaluatedCount: search.evaluatedCount,
        feasibleCount: search.feasibleCount,
      },
      plans,
      selectedPlanId: null,
    };
    state.preview = null;
    state.approval = null;
    state.phase = "proposed";
    record(
      actor,
      "Staged bounded timing search",
      `${search.evaluatedCount.toLocaleString("en-US")} evaluated · ${search.feasibleCount.toLocaleString("en-US")} feasible · revision ${state.workspaceRevision}`,
    );
    emit();
    return {
      ok: true,
      workspaceRevision: state.workspaceRevision,
      proposal: publicProposal(state.proposal, state.cues),
      nextAction:
        "Preview the staged plans. The human must select and approve one exact plan in the visible app.",
    };
  }

  async function previewTimingPlan({ proposalId, planId }, actor) {
    const proposal = assertProposal(state, proposalId);
    const plan = proposal.plans.find((candidate) => candidate.id === planId);
    if (!plan) {
      throw new CueMendError(
        "PLAN_NOT_FOUND",
        `Plan ${planId} is not part of proposal ${proposal.id}.`,
        "Use one of the plan IDs returned by the current proposal.",
      );
    }
    state.previewSerial += 1;
    state.preview = {
      serial: state.previewSerial,
      proposalId: proposal.id,
      planId: plan.id,
      workspaceRevision: state.workspaceRevision,
      actor,
    };
    record(
      actor,
      "Previewed timing plan",
      `${plan.label} · ${plan.cost.changedCueCount} cue changes · 0 conflicts`,
    );
    emit();
    return {
      ok: true,
      workspaceRevision: state.workspaceRevision,
      proposalId: proposal.id,
      plan: publicPlan(plan, state.cues),
      previewCues: clone(plan.cues),
      optionalBeatWarning: state.beats
        .filter((beat) => !beat.locked)
        .flatMap((beat) =>
          plan.cues
            .filter(
              (cue) =>
                Math.min(cue.end, beat.end) - Math.max(cue.start, beat.start) >
                1e-9,
            )
            .map((cue) => ({ beatId: beat.id, cueId: cue.id })),
        ),
      nextAction:
        "Show the A/B preview to the human. Only the visible app can change artistic locks, select a plan, and approve it.",
    };
  }

  function discardTimingPlan({ proposalId }, actor) {
    assertPhase(
      state,
      ["proposed", "stale", "approved"],
      "Discarding a timing plan",
    );
    if (!state.proposal) {
      throw new CueMendError(
        "NO_PROPOSAL",
        "There is no proposal to discard.",
        "Stage a timing plan if another attempt is needed.",
      );
    }
    if (proposalId !== state.proposal.id) {
      throw new CueMendError(
        "PROPOSAL_MISMATCH",
        "Only the current proposal can be discarded.",
        "Inspect the current rehearsal and retry with its proposal ID.",
      );
    }
    const discardedId = state.proposal.id;
    state.proposal = null;
    state.preview = null;
    state.approval = null;
    state.phase = state.receipt ? "committed" : "baseline";
    record(actor, "Discarded timing proposal", discardedId);
    emit();
    return {
      ok: true,
      discardedProposalId: discardedId,
      workspaceRevision: state.workspaceRevision,
    };
  }

  async function selectPlan({ proposalId, planId }, actor) {
    assertActor(actor, ["HUMAN"], "Selecting an artistic timing alternative");
    assertPhase(state, ["proposed", "approved"], "Selecting a timing plan");
    const proposal = assertProposal(state, proposalId);
    const plan = proposal.plans.find((candidate) => candidate.id === planId);
    if (!plan) {
      throw new CueMendError(
        "PLAN_NOT_FOUND",
        `Plan ${planId} is not part of the current proposal.`,
        "Select one of the visible alternatives.",
      );
    }
    proposal.selectedPlanId = plan.id;
    state.approval = null;
    state.phase = "proposed";
    record(actor, "Selected artistic alternative", `${plan.label} · ${plan.id}`);
    emit();
    return { ok: true, proposalId: proposal.id, planId: plan.id };
  }

  async function approveSelectedPlan({ proposalId }, actor) {
    assertActor(actor, ["HUMAN"], "Approving an exact caption plan");
    assertPhase(state, ["proposed", "approved"], "Approving a timing plan");
    const proposal = assertProposal(state, proposalId);
    if (!proposal.selectedPlanId) {
      throw new CueMendError(
        "PLAN_SELECTION_REQUIRED",
        "No staged alternative is selected.",
        "Select one visible plan before approving it.",
      );
    }
    const plan = proposal.plans.find(
      (candidate) => candidate.id === proposal.selectedPlanId,
    );
    const digest = await sha256Hex({
      proposalId: proposal.id,
      proposalDigest: proposal.digest,
      planId: plan.id,
      planDigest: plan.digest,
      baseRevision: proposal.baseRevision,
    });
    state.approval = {
      proposalId: proposal.id,
      proposalDigest: proposal.digest,
      planId: plan.id,
      planDigest: plan.digest,
      baseRevision: proposal.baseRevision,
      digest,
    };
    state.phase = "approved";
    record(
      actor,
      "Approved exact timing plan",
      `${plan.label} · approval ${digest.slice(0, 12)}`,
    );
    emit();
    return {
      ok: true,
      proposalId: proposal.id,
      planId: plan.id,
      approvalDigest: digest,
      nextAction:
        "The one-shot cuemend_commit_approved_plan capability is now available.",
    };
  }

  function toggleBeatLock({ beatId, expectedRevision }, actor) {
    assertActor(actor, ["HUMAN"], "Changing an artistic beat lock");
    assertPhase(
      state,
      ["baseline", "proposed", "stale", "approved"],
      "Changing an artistic beat lock",
    );
    assertRevision(state, expectedRevision);
    const beat = state.beats.find((candidate) => candidate.id === beatId);
    if (!beat) {
      throw new CueMendError(
        "BEAT_NOT_FOUND",
        `Unknown artistic beat: ${beatId}.`,
        "Use a beat ID from the current rehearsal snapshot.",
      );
    }
    beat.locked = !beat.locked;
    state.workspaceRevision += 1;
    state.preview = null;
    state.approval = null;
    if (state.proposal) {
      state.proposal.stale = true;
      state.phase = "stale";
    } else {
      state.phase = state.receipt ? "committed" : "baseline";
    }
    record(
      actor,
      beat.locked ? "Protected artistic beat" : "Released artistic beat",
      `${beat.label} · revision ${state.workspaceRevision}`,
    );
    emit();
    return {
      ok: true,
      beat: clone(beat),
      workspaceRevision: state.workspaceRevision,
      proposalStale: Boolean(state.proposal?.stale),
      audit: auditTrack({
        cues: state.cues,
        beats: state.beats,
        profile: state.profile,
        reservedRegions: state.reservedRegions,
      }),
    };
  }

  async function commitApprovedPlan({ requestId }, actor) {
    if (typeof requestId !== "string" || !/^[a-zA-Z0-9_-]{8,64}$/.test(requestId)) {
      throw new CueMendError(
        "INVALID_REQUEST_ID",
        "requestId must contain 8–64 letters, numbers, underscores, or hyphens.",
        "Retry once with a stable unique requestId and reuse it only for an exact replay.",
      );
    }
    if (state.committedRequests[requestId]) {
      return {
        ok: true,
        idempotentReplay: true,
        receipt: clone(state.committedRequests[requestId]),
      };
    }
    if (!state.approval) {
      throw new CueMendError(
        "HUMAN_APPROVAL_REQUIRED",
        "No current human approval is bound to the staged plan.",
        "Ask the human to select and approve the exact plan in the visible app.",
      );
    }
    const proposal = assertProposal(state, state.approval.proposalId);
    const plan = proposal.plans.find(
      (candidate) => candidate.id === state.approval.planId,
    );
    if (
      !plan ||
      state.approval.planDigest !== plan.digest ||
      state.approval.proposalDigest !== proposal.digest
    ) {
      throw new CueMendError(
        "APPROVAL_MISMATCH",
        "The approval no longer matches the exact staged proposal.",
        "Ask the human to inspect and approve the current plan again.",
      );
    }
    const audit = auditTrack({
      cues: plan.cues,
      beats: state.beats,
      profile: state.profile,
      reservedRegions: state.reservedRegions,
    });
    if (!audit.ok) {
      throw new CueMendError(
        "REVALIDATION_FAILED",
        "The approved plan no longer satisfies the current production profile.",
        "Re-audit the current revision and stage a new plan.",
        { issues: audit.issues },
      );
    }

    const beforeAudit = auditTrack({
      cues: state.cues,
      beats: state.beats,
      profile: state.profile,
      reservedRegions: state.reservedRegions,
    });
    const priorRevision = state.workspaceRevision;
    const trackDigest = await sha256Hex(plan.cues);
    const lockedBeatDigest = await sha256Hex(
      state.beats.filter((beat) => beat.locked),
    );
    state.cues = clone(plan.cues);
    state.workspaceRevision += 1;
    state.phase = "committed";
    state.preview = null;
    const receipt = {
      id: `receipt-${trackDigest.slice(0, 12)}`,
      requestId,
      actor,
      priorRevision,
      workspaceRevision: state.workspaceRevision,
      proposalId: proposal.id,
      proposalDigest: proposal.digest,
      planId: plan.id,
      planDigest: plan.digest,
      approvalDigest: state.approval.digest,
      trackDigest,
      lockedBeatDigest,
      beforeIssueCount: beforeAudit.issueCount,
      afterIssueCount: audit.issueCount,
      changedCueCount: plan.cost.changedCueCount,
    };
    state.receipt = receipt;
    state.committedRequests[requestId] = clone(receipt);
    state.approval = null;
    record(
      actor,
      "Committed approved caption plan",
      `${beforeAudit.issueCount} → 0 conflicts · revision ${state.workspaceRevision}`,
    );
    emit();
    return { ok: true, idempotentReplay: false, receipt: clone(receipt) };
  }

  async function verifyAndExport(_payload, actor) {
    if (!state.receipt || state.phase !== "committed") {
      throw new CueMendError(
        "COMMIT_REQUIRED",
        "There is no committed caption track to verify or export.",
        "Stage a plan, obtain human approval, and commit it first.",
      );
    }
    const audit = auditTrack({
      cues: state.cues,
      beats: state.beats,
      profile: state.profile,
      reservedRegions: state.reservedRegions,
    });
    const vtt = exportWebVtt(state.cues, state.profile);
    const trackDigest = await sha256Hex(state.cues);
    const vttDigest = await sha256Hex(vtt);
    const certificate = buildCertificate({
      workspaceRevision: state.workspaceRevision,
      profile: state.profile,
      beats: state.beats,
      audit,
      trackDigest,
      vttDigest,
      proposalDigest: state.receipt.proposalDigest,
      search: state.proposal.search,
    });
    certificate.digest = await sha256Hex(certificate);
    state.lastVerification = {
      ok: audit.ok,
      audit,
      vtt,
      vttDigest,
      certificate,
    };
    record(
      actor,
      "Verified and exported WebVTT",
      `0 conflicts · VTT ${vttDigest.slice(0, 12)} · certificate ${certificate.digest.slice(0, 12)}`,
    );
    emit();
    return {
      ok: audit.ok,
      workspaceRevision: state.workspaceRevision,
      audit,
      vtt,
      vttDigest,
      certificate,
    };
  }

  async function dispatch(command, payload = {}, actor = "HUMAN") {
    switch (command) {
      case "getRehearsal":
        record(actor, "Inspected rehearsal state", `Revision ${state.workspaceRevision}`);
        emit();
        return publicSnapshot(state);
      case "auditCaptions": {
        const audit = auditTrack({
          cues: state.cues,
          beats: state.beats,
          profile: state.profile,
          reservedRegions: state.reservedRegions,
        });
        record(actor, "Audited active caption track", `${audit.issueCount} conflicts found`);
        emit();
        return { ok: true, workspaceRevision: state.workspaceRevision, audit };
      }
      case "stageTimingPlan":
        return stageTimingPlan(payload, actor);
      case "previewTimingPlan":
        return previewTimingPlan(payload, actor);
      case "discardTimingPlan":
        return discardTimingPlan(payload, actor);
      case "selectPlan":
        return selectPlan(payload, actor);
      case "approveSelectedPlan":
        return approveSelectedPlan(payload, actor);
      case "toggleBeatLock":
        return toggleBeatLock(payload, actor);
      case "commitApprovedPlan":
        return commitApprovedPlan(payload, actor);
      case "verifyAndExport":
        return verifyAndExport(payload, actor);
      case "reset":
        assertActor(actor, ["HUMAN"], "Resetting the rehearsal fixture");
        state = createInitialWorkspace();
        record(actor, "Reset rehearsal fixture", "Returned to deterministic revision 1");
        emit();
        return publicSnapshot(state);
      default:
        throw new CueMendError(
          "UNKNOWN_COMMAND",
          `Unknown CueMend command: ${command}.`,
          "Use a command exposed by the current product state.",
        );
    }
  }

  return {
    dispatch,
    getSnapshot: () => publicSnapshot(state),
    getInternalState: () => clone(state),
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export function snapshotFingerprint(snapshot) {
  return stableStringify({
    workspaceRevision: snapshot.workspaceRevision,
    phase: snapshot.phase,
    cues: snapshot.cues,
    beats: snapshot.beats,
    proposal: snapshot.proposal,
    approval: snapshot.approval,
    receipt: snapshot.receipt,
  });
}
