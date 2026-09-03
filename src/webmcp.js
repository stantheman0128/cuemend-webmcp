import { CueMendError } from "./commands.js";

const NO_INPUT = Object.freeze({
  type: "object",
  properties: {},
  additionalProperties: false,
});

function objectSchema(properties, required = []) {
  return {
    type: "object",
    properties,
    required,
    additionalProperties: false,
  };
}

function textProperty(description, { pattern, enumValues } = {}) {
  const property = { type: "string", description };
  if (pattern) property.pattern = pattern;
  if (enumValues) property.enum = enumValues;
  return property;
}

function integerProperty(description, minimum = 1) {
  return { type: "integer", minimum, description };
}

function limitForAgent(value, maxCharacters = 14_000) {
  const text = JSON.stringify(value);
  if (text.length <= maxCharacters) return text;
  return JSON.stringify({
    ok: false,
    error: {
      code: "OUTPUT_BUDGET_EXCEEDED",
      message: `CueMend refused a ${text.length}-character result because the tool output budget is ${maxCharacters}.`,
      nextAction: "Request a narrower preview or inspect the visible CueMend UI.",
    },
  });
}

function normalizeSuccess(result) {
  return {
    content: [{ type: "text", text: limitForAgent(result) }],
  };
}

function normalizeError(error) {
  const body =
    error instanceof CueMendError
      ? error.toJSON()
      : {
          ok: false,
          error: {
            code: "INTERNAL_ERROR",
            message: error instanceof Error ? error.message : String(error),
            nextAction: "Inspect the visible CueMend status and retry from current state.",
          },
        };
  return {
    content: [{ type: "text", text: limitForAgent(body) }],
    isError: true,
  };
}

function validateNoUnknownKeys(args, allowed) {
  if (!args || typeof args !== "object" || Array.isArray(args)) {
    throw new CueMendError(
      "INVALID_ARGUMENTS",
      "Tool arguments must be a JSON object.",
      "Retry with the exact input schema.",
    );
  }
  const unknown = Object.keys(args).filter((key) => !allowed.includes(key));
  if (unknown.length) {
    throw new CueMendError(
      "UNKNOWN_ARGUMENT",
      `Unknown argument${unknown.length === 1 ? "" : "s"}: ${unknown.join(", ")}.`,
      "Retry with only properties declared by the tool schema.",
      { unknown },
    );
  }
}

function validateString(value, key, pattern) {
  if (typeof value !== "string" || !value.length || (pattern && !pattern.test(value))) {
    throw new CueMendError(
      "INVALID_ARGUMENT",
      `${key} has an invalid value.`,
      "Use the exact identifier returned by the current rehearsal state.",
      { key },
    );
  }
}

function validateRevision(value) {
  if (!Number.isInteger(value) || value < 1) {
    throw new CueMendError(
      "INVALID_REVISION",
      "expectedRevision must be a positive integer.",
      "Call cuemend_get_rehearsal and use its workspaceRevision.",
    );
  }
}

function commandTool({
  store,
  name,
  title,
  description,
  inputSchema,
  command,
  validate,
  readOnly = false,
}) {
  return {
    name,
    title,
    description,
    inputSchema,
    annotations: {
      readOnlyHint: readOnly,
      untrustedContentHint: false,
    },
    async execute(args = {}, options = {}) {
      try {
        if (options.signal?.aborted) {
          throw new CueMendError(
            "ABORTED",
            `${name} was cancelled before execution.`,
            "Inspect current state before deciding whether to retry.",
          );
        }
        validate?.(args);
        const result = await store.dispatch(command, args, "AGENT");
        return normalizeSuccess(result);
      } catch (error) {
        return normalizeError(error);
      }
    },
  };
}

export function getCueMendToolDefinitions(store, snapshot = store.getSnapshot()) {
  const tools = [
    commandTool({
      store,
      name: "cuemend_get_rehearsal",
      title: "Inspect CueMend rehearsal",
      description:
        "Read the complete bounded CueMend rehearsal: exact revision, cue IDs and timings, human-controlled artistic beats, demo profile, current audit, proposal phase, and safe next actions. Call this before any revision-bound action.",
      inputSchema: NO_INPUT,
      command: "getRehearsal",
      validate: (args) => validateNoUnknownKeys(args, []),
      readOnly: true,
    }),
    commandTool({
      store,
      name: "cuemend_audit_captions",
      title: "Audit active caption track",
      description:
        "Deterministically audit the active caption track against the named CueMend demo production profile and current human-protected beats. Does not stage or apply changes.",
      inputSchema: NO_INPUT,
      command: "auditCaptions",
      validate: (args) => validateNoUnknownKeys(args, []),
      readOnly: true,
    }),
  ];

  if (snapshot.phase !== "committed") {
    tools.push(
      commandTool({
        store,
        name: "cuemend_stage_timing_plan",
        title: "Stage bounded timing plan",
        description:
          "Enumerate all 6,561 authored cue-variant combinations against the current revision and protected beats. Stage up to three zero-conflict alternatives without changing the active track. The human must inspect, select, and approve an exact plan in the visible app.",
        inputSchema: objectSchema(
          {
            expectedRevision: integerProperty(
              "Exact workspaceRevision returned by cuemend_get_rehearsal.",
            ),
          },
          ["expectedRevision"],
        ),
        command: "stageTimingPlan",
        validate(args) {
          validateNoUnknownKeys(args, ["expectedRevision"]);
          validateRevision(args.expectedRevision);
        },
      }),
    );
  }

  if (
    snapshot.phase !== "committed" &&
    snapshot.proposal &&
    !snapshot.proposal.stale
  ) {
    tools.push(
      commandTool({
        store,
        name: "cuemend_preview_timing_plan",
        title: "Preview staged timing plan",
        description:
          "Read an exact staged alternative, its cue-level diff, cost, zero-conflict forecast, A/B preview cues, and any overlap with an optional human beat. Does not select, approve, or commit it.",
        inputSchema: objectSchema(
          {
            proposalId: textProperty("Current proposal ID.", {
              pattern: "^proposal-[a-f0-9]{12}$",
            }),
            planId: textProperty("Plan ID from the current proposal.", {
              pattern: "^plan-[1-3]$",
            }),
          },
          ["proposalId", "planId"],
        ),
        command: "previewTimingPlan",
        validate(args) {
          validateNoUnknownKeys(args, ["proposalId", "planId"]);
          validateString(args.proposalId, "proposalId", /^proposal-[a-f0-9]{12}$/);
          validateString(args.planId, "planId", /^plan-[1-3]$/);
        },
      }),
    );
  }

  if (snapshot.phase !== "committed" && snapshot.proposal) {
    tools.push(
      commandTool({
        store,
        name: "cuemend_discard_timing_plan",
        title: "Discard staged timing plan",
        description:
          "Discard only the current proposal by exact ID. This is the safe compensating action for a stale or unwanted stage and never changes active cues or artistic locks.",
        inputSchema: objectSchema(
          {
            proposalId: textProperty("Current proposal ID.", {
              pattern: "^proposal-[a-f0-9]{12}$",
            }),
          },
          ["proposalId"],
        ),
        command: "discardTimingPlan",
        validate(args) {
          validateNoUnknownKeys(args, ["proposalId"]);
          validateString(args.proposalId, "proposalId", /^proposal-[a-f0-9]{12}$/);
        },
      }),
    );
  }

  if (snapshot.phase === "approved" && snapshot.approval) {
    tools.push(
      commandTool({
        store,
        name: "cuemend_commit_approved_plan",
        title: "Commit human-approved caption plan",
        description:
          "Commit the one exact plan selected and approved in the visible CueMend UI. Revalidates proposal digest, plan digest, production profile, protected beats, and workspace revision. Use a stable requestId for idempotency. This capability exists only while that approval is current.",
        inputSchema: objectSchema(
          {
            requestId: textProperty(
              "Stable idempotency key: 8–64 letters, numbers, underscores, or hyphens.",
              { pattern: "^[a-zA-Z0-9_-]{8,64}$" },
            ),
          },
          ["requestId"],
        ),
        command: "commitApprovedPlan",
        validate(args) {
          validateNoUnknownKeys(args, ["requestId"]);
          validateString(args.requestId, "requestId", /^[a-zA-Z0-9_-]{8,64}$/);
        },
      }),
    );
  }

  if (snapshot.phase === "committed" && snapshot.receipt) {
    tools.push(
      commandTool({
        store,
        name: "cuemend_verify_and_export",
        title: "Verify and export committed captions",
        description:
          "Independently re-audit the committed cue track, generate editable WebVTT, and return SHA-256 digests plus an explicit limitations certificate bound to the committed proposal.",
        inputSchema: NO_INPUT,
        command: "verifyAndExport",
        validate: (args) => validateNoUnknownKeys(args, []),
        readOnly: true,
      }),
    );
  }

  return tools;
}

function inventorySignature(tools) {
  return tools.map((tool) => tool.name).sort().join("|");
}

export async function attachCueMendWebMcp({
  store,
  documentRef = globalThis.document,
  onInventory = () => {},
  lateInjectionAttempts = 20,
  lateInjectionDelayMs = 125,
} = {}) {
  if (!store) throw new Error("attachCueMendWebMcp requires a store.");

  for (let attempt = 0; attempt <= lateInjectionAttempts; attempt += 1) {
    if (documentRef?.modelContext?.registerTool) break;
    if (attempt === lateInjectionAttempts || lateInjectionDelayMs === 0) {
      onInventory({
        supported: false,
        names: [],
        message: "WebMCP API unavailable; ordinary CueMend controls remain active.",
      });
      return {
        supported: false,
        ready: Promise.resolve(),
        stop() {},
      };
    }
    await new Promise((resolve) => setTimeout(resolve, lateInjectionDelayMs));
  }

  const context = documentRef.modelContext;
  let stopped = false;
  let controller = null;
  let signature = "";
  let queue = Promise.resolve();

  async function refresh(snapshot) {
    if (stopped) return;
    const tools = getCueMendToolDefinitions(store, snapshot);
    const nextSignature = inventorySignature(tools);
    if (nextSignature === signature) {
      onInventory({ supported: true, names: tools.map((tool) => tool.name) });
      return;
    }
    controller?.abort();
    const registrationController = new AbortController();
    controller = registrationController;
    signature = nextSignature;
    try {
      await Promise.all(
        tools.map((tool) =>
          context.registerTool(tool, { signal: registrationController.signal }),
        ),
      );
      if (!stopped && !registrationController.signal.aborted) {
        onInventory({ supported: true, names: tools.map((tool) => tool.name) });
      }
    } catch (error) {
      registrationController.abort();
      if (controller === registrationController) {
        controller = null;
        signature = "";
      }
      if (stopped) return;
      onInventory({
        supported: true,
        names: [],
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  function enqueue(snapshot) {
    queue = queue.then(() => refresh(snapshot));
    return queue;
  }

  const unsubscribe = store.subscribe((snapshot) => enqueue(snapshot));
  enqueue(store.getSnapshot());

  return {
    supported: true,
    get ready() {
      return queue;
    },
    stop() {
      stopped = true;
      unsubscribe();
      controller?.abort();
      controller = null;
      signature = "";
    },
  };
}
