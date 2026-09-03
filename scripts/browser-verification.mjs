import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const DEFAULT_URL = "https://stantheman0128.github.io/cuemend-webmcp/";

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const [name, inlineValue] = token.slice(2).split("=", 2);
    values[name] = inlineValue ?? argv[++index];
  }
  return values;
}

const args = parseArgs(process.argv.slice(2));
const endpoint = args.endpoint ?? "http://127.0.0.1:9225";
const appUrl = args.url ?? DEFAULT_URL;
const mode = args.mode ?? "webmcp";
const runCount = Number(args.runs ?? 3);
const outputDir = path.resolve(args["output-dir"] ?? "artifacts/browser-verification");

function invariant(condition, message, details) {
  if (condition) return;
  const suffix = details === undefined ? "" : `\n${JSON.stringify(details, null, 2)}`;
  throw new Error(`${message}${suffix}`);
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitFor(check, message, timeoutMs = 10_000, intervalMs = 75) {
  const deadline = Date.now() + timeoutMs;
  let lastValue;
  while (Date.now() < deadline) {
    lastValue = await check();
    if (lastValue) return lastValue;
    await wait(intervalMs);
  }
  throw new Error(`${message}; last value: ${JSON.stringify(lastValue)}`);
}

class CdpClient {
  static async connect(webSocketUrl) {
    invariant(typeof WebSocket === "function", "Node.js must provide the built-in WebSocket client.");
    const socket = new WebSocket(webSocketUrl);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Timed out opening the CDP socket.")), 10_000);
      socket.addEventListener("open", () => {
        clearTimeout(timer);
        resolve();
      }, { once: true });
      socket.addEventListener("error", () => {
        clearTimeout(timer);
        reject(new Error("Chrome rejected the CDP socket."));
      }, { once: true });
    });
    return new CdpClient(socket);
  }

  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
    this.eventLog = [];
    socket.addEventListener("message", (event) => this.handleMessage(event.data));
    socket.addEventListener("close", () => {
      for (const { reject } of this.pending.values()) {
        reject(new Error("CDP socket closed before the command completed."));
      }
      this.pending.clear();
    });
  }

  handleMessage(raw) {
    const message = JSON.parse(String(raw));
    if (message.id) {
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) {
        const error = new Error(message.error.message);
        error.code = message.error.code;
        error.data = message.error.data;
        pending.reject(error);
      } else {
        pending.resolve(message.result ?? {});
      }
      return;
    }
    if (!message.method) return;
    this.eventLog.push({ method: message.method, params: message.params ?? {} });
    for (const listener of this.listeners.get(message.method) ?? []) {
      listener(message.params ?? {});
    }
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  on(method, listener) {
    const listeners = this.listeners.get(method) ?? new Set();
    listeners.add(listener);
    this.listeners.set(method, listeners);
    return () => listeners.delete(listener);
  }

  waitForEvent(method, predicate = () => true, timeoutMs = 10_000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        unsubscribe();
        reject(new Error(`Timed out waiting for ${method}.`));
      }, timeoutMs);
      const unsubscribe = this.on(method, (params) => {
        if (!predicate(params)) return;
        clearTimeout(timer);
        unsubscribe();
        resolve(params);
      });
    });
  }

  close() {
    this.socket.close();
  }
}

async function findPageTarget() {
  const deadline = Date.now() + 15_000;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${endpoint}/json/list`);
      if (!response.ok) throw new Error(`CDP endpoint returned ${response.status}.`);
      const targets = await response.json();
      const target = targets.find(
        (candidate) => candidate.type === "page" && candidate.url.startsWith(appUrl),
      ) ?? targets.find((candidate) => candidate.type === "page");
      if (target?.webSocketDebuggerUrl) return target;
    } catch (error) {
      lastError = error;
    }
    await wait(125);
  }
  throw new Error(`Could not find the Chrome page target at ${endpoint}: ${lastError?.message ?? "no page"}`);
}

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
  }
  return result.result?.value;
}

async function uiState(client) {
  return evaluate(
    client,
    `(() => ({
      title: document.title,
      revision: Number(document.querySelector('#revision-value')?.textContent),
      phase: document.querySelector('#phase-badge')?.textContent?.trim().toLowerCase(),
      conflicts: Number(document.querySelector('#metric-conflicts')?.textContent),
      protectedBeats: Number(document.querySelector('#metric-beats')?.textContent),
      proposalStatus: document.querySelector('#proposal-status')?.textContent?.trim(),
      runtime: document.querySelector('#runtime-label')?.textContent?.trim(),
      track: document.querySelector('#stage-track-label')?.textContent?.trim(),
      action: document.querySelector('#action-title')?.textContent?.trim(),
      tools: [...document.querySelectorAll('#tool-inventory .tool-chip')].map((node) => node.textContent.trim()),
      activity: [...document.querySelectorAll('#activity-list .activity-item')].map((node) => ({
        actor: node.dataset.actor,
        action: node.querySelector('strong')?.textContent?.trim(),
        detail: node.querySelector('span:not(.activity-actor)')?.textContent?.trim(),
      })),
    }))()` ,
  );
}

async function waitForUi(client, predicate, message, timeoutMs = 10_000) {
  return waitFor(async () => {
    const state = await uiState(client);
    return predicate(state) ? state : false;
  }, message, timeoutMs);
}

function selectorLiteral(selector) {
  return JSON.stringify(selector);
}

async function clickSelector(client, selector) {
  return evaluate(
    client,
    `(() => {
      const element = document.querySelector(${selectorLiteral(selector)});
      if (!(element instanceof HTMLElement)) throw new Error('Missing clickable element: ' + ${selectorLiteral(selector)});
      if (element.matches(':disabled')) throw new Error('Element is disabled: ' + ${selectorLiteral(selector)});
      element.scrollIntoView({ block: 'center', inline: 'center' });
      element.click();
      return true;
    })()`,
  );
}

async function clickButtonText(client, text) {
  return evaluate(
    client,
    `(() => {
      const wanted = ${JSON.stringify(text)};
      const element = [...document.querySelectorAll('button')].find((button) => button.textContent.trim() === wanted);
      if (!element) throw new Error('Missing button: ' + wanted);
      if (element.disabled) throw new Error('Button is disabled: ' + wanted);
      element.scrollIntoView({ block: 'center', inline: 'center' });
      element.click();
      return true;
    })()`,
  );
}

async function setViewport(client, width, height) {
  await client.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });
}

async function screenshot(client, name, { width = 1440, height = 1000, fullPage = true } = {}) {
  await setViewport(client, width, height);
  await waitFor(
    async () => evaluate(client, "!document.querySelector('#toast')?.classList.contains('is-visible')"),
    "The transient status toast did not settle before capture",
    5_000,
  );
  await evaluate(client, "document.activeElement?.blur(); window.scrollTo(0, 0)");
  await wait(100);
  const metrics = await client.send("Page.getLayoutMetrics");
  const clip = fullPage
    ? {
        x: 0,
        y: 0,
        width: Math.ceil(metrics.cssContentSize.width),
        height: Math.ceil(metrics.cssContentSize.height),
        scale: 1,
      }
    : undefined;
  const result = await client.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: fullPage,
    ...(clip ? { clip } : {}),
  });
  const filePath = path.join(outputDir, name);
  fs.writeFileSync(filePath, Buffer.from(result.data, "base64"));
  return filePath;
}

function normalizedOutput(output) {
  if (typeof output === "string") {
    try {
      return normalizedOutput(JSON.parse(output));
    } catch {
      return { text: output };
    }
  }
  if (!output || typeof output !== "object") return output;
  const text = output.content?.find?.((item) => item.type === "text")?.text;
  if (typeof text !== "string") return output;
  try {
    return JSON.parse(text);
  } catch {
    return { text };
  }
}

function summarizeToolBody(body) {
  if (!body || typeof body !== "object") return body;
  return {
    ok: body.ok ?? !body.error,
    error: body.error
      ? {
          code: body.error.code,
          message: body.error.message,
          nextAction: body.error.nextAction,
        }
      : undefined,
    phase: body.phase,
    workspaceRevision: body.workspaceRevision,
    issueCount: body.audit?.issueCount,
    proposalId: body.proposal?.id ?? body.proposalId,
    planIds: body.proposal?.plans?.map((plan) => plan.id),
    evaluatedCount: body.proposal?.evaluatedCount,
    feasibleCount: body.proposal?.feasibleCount,
    optionalBeatWarnings: body.optionalBeatWarning?.map((warning) => ({
      beatId: warning.beatId,
      cueId: warning.cueId,
    })),
    receipt: body.receipt
      ? {
          id: body.receipt.id,
          requestId: body.receipt.requestId,
          priorRevision: body.receipt.priorRevision,
          workspaceRevision: body.receipt.workspaceRevision,
          beforeIssueCount: body.receipt.beforeIssueCount,
          afterIssueCount: body.receipt.afterIssueCount,
          trackDigest: body.receipt.trackDigest,
        }
      : undefined,
    vttDigest: body.vttDigest,
    certificateDigest: body.certificate?.digest,
    certificateStatement: body.certificate?.statement,
    limitations: body.certificate?.limitations,
  };
}

function callEvidence(call) {
  return {
    toolName: call.toolName,
    invocationId: call.invocationId,
    status: call.status,
    errorText: call.errorText,
    summary: call.summary,
  };
}

async function runKeyboardCheck(client) {
  await evaluate(client, "document.activeElement?.blur(); window.scrollTo(0, 0)");
  const focusOrder = [];
  for (let index = 0; index < 16; index += 1) {
    await client.send("Input.dispatchKeyEvent", {
      type: "keyDown",
      key: "Tab",
      code: "Tab",
      windowsVirtualKeyCode: 9,
      nativeVirtualKeyCode: 9,
    });
    await client.send("Input.dispatchKeyEvent", {
      type: "keyUp",
      key: "Tab",
      code: "Tab",
      windowsVirtualKeyCode: 9,
      nativeVirtualKeyCode: 9,
    });
    focusOrder.push(await evaluate(
      client,
      `(() => ({
        tag: document.activeElement?.tagName,
        id: document.activeElement?.id || null,
        text: document.activeElement?.textContent?.trim()?.slice(0, 80) || null,
        href: document.activeElement?.getAttribute?.('href') || null,
      }))()`,
    ));
  }
  invariant(focusOrder[0]?.href === "#workspace", "The skip link must be the first keyboard stop.", focusOrder);
  invariant(focusOrder.some((entry) => entry.id === "reset-button"), "Keyboard traversal did not reach Reset demo.", focusOrder);
  invariant(focusOrder.some((entry) => entry.id === "time-scrubber"), "Keyboard traversal did not reach the scrubber.", focusOrder);
  return focusOrder;
}

async function runReducedMotionCheck(client) {
  await client.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  const result = await evaluate(
    client,
    `(() => ({
      matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
      toastTransition: getComputedStyle(document.querySelector('#toast')).transitionDuration,
      markAnimation: getComputedStyle(document.querySelector('.brand-mark span')).animationDuration,
    }))()`,
  );
  invariant(result.matches, "Reduced-motion emulation did not reach the document.", result);
  const seconds = (value) => Number.parseFloat(value) * (value.endsWith("ms") ? 0.001 : 1);
  invariant(seconds(result.toastTransition) <= 0.01, "Reduced-motion transition remains too long.", result);
  invariant(seconds(result.markAnimation) <= 0.01, "Reduced-motion animation remains too long.", result);
  await client.send("Emulation.setEmulatedMedia", { features: [] });
  return result;
}

async function runTransportCheck(client) {
  await evaluate(
    client,
    `(() => {
      const scrubber = document.querySelector('#time-scrubber');
      scrubber.value = '8.8';
      scrubber.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    })()`,
  );
  const scrubbed = await waitFor(
    async () => {
      const value = await evaluate(
        client,
        `(() => ({
          timecode: document.querySelector('#current-time')?.textContent?.trim(),
          value: Number(document.querySelector('#time-scrubber')?.value),
          caption: document.querySelector('#caption-text')?.textContent?.trim(),
        }))()`,
      );
      return value.timecode === "00:08.8" ? value : false;
    },
    "Scrubbing did not update the visible timecode",
  );
  await clickSelector(client, "#play-button");
  const advanced = await waitFor(
    async () => {
      const value = Number(await evaluate(client, "document.querySelector('#time-scrubber')?.value"));
      return value > 8.9 ? value : false;
    },
    "Playback did not advance the cue rail",
    3_000,
  );
  await clickSelector(client, "#play-button");
  const pausedAt = Number(await evaluate(client, "document.querySelector('#time-scrubber')?.value"));
  await wait(150);
  const remainedAt = Number(await evaluate(client, "document.querySelector('#time-scrubber')?.value"));
  invariant(Math.abs(remainedAt - pausedAt) < 0.02, "Pause did not stop playback.", { pausedAt, remainedAt });
  await clickSelector(client, "#speed-button");
  const doubleSpeed = await evaluate(client, "document.querySelector('#speed-button')?.textContent?.trim()");
  invariant(doubleSpeed === "2×", "Playback speed did not switch to 2x.", { doubleSpeed });
  await clickSelector(client, "#speed-button");
  return { scrubbed, advancedTo: advanced, pausedAt, remainedAt, doubleSpeed };
}

async function runOrdinaryUi(client) {
  const initial = await waitForUi(
    client,
    (state) => state.runtime === "Standard UI mode" && state.conflicts === 7,
    "CueMend did not settle into ordinary UI mode",
    15_000,
  );
  await screenshot(client, "ordinary-ui-baseline-desktop.png");
  const keyboard = await runKeyboardCheck(client);
  const reducedMotion = await runReducedMotionCheck(client);
  const transport = await runTransportCheck(client);

  await clickButtonText(client, "Run deterministic audit");
  await waitForUi(client, (state) => state.activity.at(-1)?.action === "Audited active caption track", "UI audit did not finish");
  await clickButtonText(client, "Stage repair plan");
  await waitForUi(client, (state) => state.phase === "proposed", "UI staging did not finish");
  await clickButtonText(client, "Preview plan 1");
  await waitForUi(client, (state) => state.track?.startsWith("STAGED"), "UI preview did not switch the shared A/B view");
  await clickButtonText(client, "Protect Jon's breath");
  const stale = await waitForUi(
    client,
    (state) => state.phase === "stale" && state.revision === 2 && state.conflicts === 8,
    "UI beat lock did not invalidate the proposal",
  );
  await clickSelector(client, "[data-restage]");
  await waitForUi(client, (state) => state.phase === "proposed" && state.proposalStatus === "Staged only", "UI replan did not finish");
  await clickSelector(client, "[data-preview-plan='plan-1']");
  await waitForUi(client, (state) => state.track?.startsWith("STAGED"), "UI second preview did not render");
  await clickSelector(client, "[data-select-plan='plan-1']");
  await waitFor(async () => evaluate(client, "document.querySelector('[data-select-plan=\"plan-1\"]')?.textContent.trim() === 'Selected'"), "UI plan selection did not render");
  await clickSelector(client, "[data-approve]");
  await waitForUi(client, (state) => state.phase === "approved", "UI approval did not finish");
  await clickButtonText(client, "Apply approved plan (UI)");
  await waitForUi(client, (state) => state.phase === "committed" && state.conflicts === 0, "UI commit did not finish");
  await clickButtonText(client, "Verify & build evidence pack");
  const final = await waitForUi(client, (state) => state.action === "Verified, portable, still editable", "UI verification did not finish");
  invariant(final.activity.some((entry) => entry.actor === "HUMAN"), "Ordinary UI provenance did not record human actions.", final);
  await screenshot(client, "ordinary-ui-final-desktop.png");
  await screenshot(client, "ordinary-ui-final-split.png", { width: 820, height: 1000 });
  const splitLayout = await evaluate(
    client,
    `(() => ({
      innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    }))()`,
  );
  invariant(!splitLayout.horizontalOverflow, "The split-width layout has horizontal overflow.", splitLayout);
  return {
    initial,
    stale,
    final,
    keyboardFocusOrder: keyboard,
    reducedMotion,
    transport,
    splitLayout,
  };
}

async function runNativeWebMcp(client) {
  const tools = new Map();
  const invocationResponses = new Map();
  const invocationWaiters = new Map();

  client.on("WebMCP.toolsAdded", ({ tools: added = [] }) => {
    for (const tool of added) tools.set(`${tool.frameId}:${tool.name}`, tool);
  });
  client.on("WebMCP.toolsRemoved", ({ tools: removed = [] }) => {
    for (const tool of removed) tools.delete(`${tool.frameId}:${tool.name}`);
  });
  client.on("WebMCP.toolResponded", (response) => {
    invocationResponses.set(response.invocationId, response);
    invocationWaiters.get(response.invocationId)?.(response);
    invocationWaiters.delete(response.invocationId);
  });

  const frameTree = await client.send("Page.getFrameTree");
  const frameId = frameTree.frameTree.frame.id;
  await client.send("WebMCP.enable");

  const toolNames = () => [...tools.values()]
    .filter((tool) => tool.frameId === frameId)
    .map((tool) => tool.name)
    .sort();
  const waitForTools = (contains, excludes = []) => waitFor(
    async () => {
      const names = toolNames();
      return contains.every((name) => names.includes(name)) && excludes.every((name) => !names.includes(name))
        ? names
        : false;
    },
    `Tool inventory did not converge; expected ${contains.join(", ")}`,
    10_000,
  );

  async function invoke(toolName, input = {}) {
    const { invocationId } = await client.send("WebMCP.invokeTool", { frameId, toolName, input });
    const response = invocationResponses.get(invocationId) ?? await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        invocationWaiters.delete(invocationId);
        reject(new Error(`Timed out waiting for ${toolName} (${invocationId}).`));
      }, 15_000);
      invocationWaiters.set(invocationId, (value) => {
        clearTimeout(timer);
        resolve(value);
      });
    });
    const body = normalizedOutput(response.output);
    return {
      toolName,
      invocationId,
      status: response.status,
      errorText: response.errorText,
      body,
      summary: summarizeToolBody(body),
    };
  }

  const expectedBase = [
    "cuemend_audit_captions",
    "cuemend_get_rehearsal",
    "cuemend_stage_timing_plan",
  ];
  await waitForUi(client, (state) => state.runtime?.startsWith("WebMCP ready"), "WebMCP readiness badge did not appear", 15_000);
  await waitForTools(expectedBase);
  const runs = [];

  for (let runNumber = 1; runNumber <= runCount; runNumber += 1) {
    if (runNumber > 1) {
      await clickSelector(client, "#reset-button");
      await waitForUi(client, (state) => state.phase === "baseline" && state.revision === 1 && state.conflicts === 7, `Run ${runNumber} reset did not restore the fixture`);
      await waitForTools(expectedBase, ["cuemend_verify_and_export", "cuemend_commit_approved_plan"]);
    }

    const record = {
      runNumber,
      started: await uiState(client),
      inventories: { base: toolNames() },
      calls: [],
    };
    invariant(record.started.revision === 1 && record.started.conflicts === 7, `Run ${runNumber} did not start clean.`, record.started);
    if (runNumber === 1) await screenshot(client, "native-webmcp-baseline.png");

    const inspected = await invoke("cuemend_get_rehearsal");
    record.calls.push(callEvidence(inspected));
    invariant(inspected.status === "Completed" && inspected.body.workspaceRevision === 1, "Native inspect returned the wrong revision.", inspected.summary);
    invariant((await uiState(client)).activity.at(-1)?.actor === "AGENT", "Inspect did not update visible agent provenance.");

    const audited = await invoke("cuemend_audit_captions");
    record.calls.push(callEvidence(audited));
    invariant(audited.status === "Completed" && audited.body.audit?.issueCount === 7, "Native audit did not return seven issues.", audited.summary);

    const firstStage = await invoke("cuemend_stage_timing_plan", { expectedRevision: 1 });
    record.calls.push(callEvidence(firstStage));
    invariant(firstStage.status === "Completed" && firstStage.body.proposal?.evaluatedCount === 6561, "Native stage did not run the bounded search.", firstStage.summary);
    const firstProposalId = firstStage.body.proposal.id;
    const firstPlanId = firstStage.body.proposal.plans[0].id;
    record.inventories.staged = await waitForTools([
      ...expectedBase,
      "cuemend_discard_timing_plan",
      "cuemend_preview_timing_plan",
    ]);

    const firstPreview = await invoke("cuemend_preview_timing_plan", {
      proposalId: firstProposalId,
      planId: firstPlanId,
    });
    record.calls.push(callEvidence(firstPreview));
    invariant(firstPreview.status === "Completed" && firstPreview.body.optionalBeatWarning?.some((warning) => warning.beatId === "beat-breath"), "The first native preview did not expose Jon's optional breath.", firstPreview.summary);
    await waitForUi(client, (state) => state.track?.startsWith("STAGED"), "Native preview did not update the visible A/B track");
    if (runNumber === 1) await screenshot(client, "native-webmcp-staged.png");

    await clickSelector(client, "[data-beat-id='beat-breath']");
    record.staleUi = await waitForUi(
      client,
      (state) => state.phase === "stale" && state.revision === 2 && state.conflicts === 8,
      "The human beat lock did not make the native proposal stale",
    );
    record.inventories.stale = await waitForTools(expectedBase, ["cuemend_preview_timing_plan"]);

    const staleAttempt = await invoke("cuemend_stage_timing_plan", { expectedRevision: 1 });
    record.calls.push(callEvidence(staleAttempt));
    invariant(
      staleAttempt.status === "Completed" && staleAttempt.body.error?.code === "STALE_REVISION",
      "The real stale WebMCP request was not refused with STALE_REVISION.",
      staleAttempt.summary,
    );
    invariant((await uiState(client)).phase === "stale", "The stale request mutated visible state.");
    if (runNumber === 1) await screenshot(client, "native-webmcp-stale-refused.png");

    const current = await invoke("cuemend_get_rehearsal");
    record.calls.push(callEvidence(current));
    invariant(current.body.workspaceRevision === 2, "Native re-inspection did not see revision 2.", current.summary);
    const secondStage = await invoke("cuemend_stage_timing_plan", { expectedRevision: 2 });
    record.calls.push(callEvidence(secondStage));
    const proposalId = secondStage.body.proposal.id;
    const planId = secondStage.body.proposal.plans[0].id;
    await waitForTools([...expectedBase, "cuemend_preview_timing_plan"]);
    const secondPreview = await invoke("cuemend_preview_timing_plan", { proposalId, planId });
    record.calls.push(callEvidence(secondPreview));
    const previewMetrics = secondPreview.body.plan?.metrics;
    invariant(
      previewMetrics?.cueOverlaps === 0 &&
        previewMetrics?.lockedBeatConflicts === 0 &&
        previewMetrics?.reservedRegionConflicts === 0 &&
        previewMetrics?.maxCharactersPerSecond <= 20,
      "The revision-2 preview is not zero-conflict under the demo profile.",
      secondPreview.summary,
    );

    await clickSelector(client, `[data-select-plan='${planId}']`);
    await waitFor(async () => evaluate(client, `document.querySelector('[data-select-plan="${planId}"]')?.textContent.trim() === 'Selected'`), "Human selection did not render");
    await clickSelector(client, "[data-approve]");
    record.approvedUi = await waitForUi(client, (state) => state.phase === "approved", "Human approval did not render");
    record.inventories.approved = await waitForTools([
      ...expectedBase,
      "cuemend_commit_approved_plan",
    ]);
    if (runNumber === 1) await screenshot(client, "native-webmcp-approved.png");

    const committed = await invoke("cuemend_commit_approved_plan", {
      requestId: `native-run-${String(runNumber).padStart(3, "0")}`,
    });
    record.calls.push(callEvidence(committed));
    invariant(committed.status === "Completed" && committed.body.receipt?.afterIssueCount === 0, "Native commit did not produce a zero-conflict receipt.", committed.summary);
    record.committedUi = await waitForUi(client, (state) => state.phase === "committed" && state.revision === 3 && state.conflicts === 0, "Native commit did not update the visible product");
    record.inventories.committed = await waitForTools([
      "cuemend_audit_captions",
      "cuemend_get_rehearsal",
      "cuemend_verify_and_export",
    ], ["cuemend_stage_timing_plan", "cuemend_commit_approved_plan"]);

    const verified = await invoke("cuemend_verify_and_export");
    record.calls.push(callEvidence(verified));
    invariant(
      verified.status === "Completed" && verified.body.audit?.issueCount === 0 && /^[a-f0-9]{64}$/.test(verified.body.vttDigest),
      "Native verification did not return a clean digest-bound export.",
      verified.summary,
    );
    record.finished = await waitForUi(client, (state) => state.action === "Verified, portable, still editable", "Native verification did not update visible completion");
    invariant(record.finished.activity.some((entry) => entry.actor === "AGENT"), "Native run lacks visible agent provenance.", record.finished);
    invariant(record.finished.activity.some((entry) => entry.actor === "HUMAN"), "Native run lacks visible human provenance.", record.finished);
    if (runNumber === 1) await screenshot(client, "native-webmcp-final.png");
    runs.push(record);
  }

  return {
    browserApi: "Chrome DevTools Protocol WebMCP domain",
    frameId,
    completedRuns: runs.length,
    runs,
    webMcpEvents: client.eventLog
      .filter((event) => event.method.startsWith("WebMCP."))
      .map((event) => ({ method: event.method, invocationId: event.params.invocationId, toolName: event.params.toolName, status: event.params.status })),
  };
}

async function main() {
  invariant(["ordinary", "webmcp"].includes(mode), `Unsupported mode: ${mode}`);
  invariant(Number.isInteger(runCount) && runCount >= 1 && runCount <= 10, "--runs must be an integer from 1 to 10.");
  fs.mkdirSync(outputDir, { recursive: true });
  const target = await findPageTarget();
  const client = await CdpClient.connect(target.webSocketDebuggerUrl);
  try {
    await client.send("Page.enable");
    await client.send("Runtime.enable");
    await client.send("Log.enable");
    const browser = await client.send("Browser.getVersion");
    const loaded = await waitForUi(client, (state) => state.title === "CueMend — Repair the timing. Keep the beat.", "CueMend did not load", 15_000);
    const evidence = mode === "ordinary"
      ? await runOrdinaryUi(client)
      : await runNativeWebMcp(client);
    const diagnostics = {
      runtimeExceptions: client.eventLog
        .filter((event) => event.method === "Runtime.exceptionThrown")
        .map((event) => event.params.exceptionDetails?.text ?? "Unknown exception"),
      consoleErrors: client.eventLog
        .filter((event) => event.method === "Runtime.consoleAPICalled" && event.params.type === "error")
        .map((event) => event.params.args?.map((argument) => argument.value ?? argument.description).join(" ")),
      browserLogErrors: client.eventLog
        .filter((event) => event.method === "Log.entryAdded" && event.params.entry?.level === "error")
        .map((event) => ({ source: event.params.entry.source, text: event.params.entry.text })),
    };
    invariant(diagnostics.runtimeExceptions.length === 0, "The browser recorded an uncaught runtime exception.", diagnostics);
    invariant(diagnostics.consoleErrors.length === 0, "The browser recorded a console error.", diagnostics);
    const payload = {
      ok: true,
      mode,
      appUrl,
      testedAt: new Date().toISOString(),
      target: { title: target.title, url: target.url },
      browser: {
        product: browser.product,
        protocolVersion: browser.protocolVersion,
        jsVersion: browser.jsVersion,
        userAgent: browser.userAgent,
      },
      loaded,
      diagnostics,
      evidence,
    };
    const evidencePath = path.join(outputDir, `${mode}-browser-verification.json`);
    fs.writeFileSync(evidencePath, `${JSON.stringify(payload, null, 2)}\n`);
    process.stdout.write(`${JSON.stringify({ ok: true, mode, evidencePath, completedRuns: evidence.completedRuns ?? 1 })}\n`);
  } finally {
    client.close();
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message ?? String(error)}\n`);
  process.exitCode = 1;
});
