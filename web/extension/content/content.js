// InstaClean Content Script — runs on instagram.com

let state = "idle";
let recentLog = [];
let waitWakeResolver = null;
let activeRunUsernames = [];
let activeRunConfig = null;
let activeRunStartedAt = null;
let activeRunAttempted = [];
let heartbeatTimer = null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms + Math.random() * 300));
const BUSY_STATES = new Set(["running", "paused", "stopping"]);
const DEFAULT_RUN_CONFIG = { delay: 30000, batchSize: 5, batchPause: 300000 };
const MAX_ACTION_DELAY_MS = 120000;
const MAX_BATCH_PAUSE_MS = 900000;
const MAX_RATE_LIMIT_WAIT_MS = 900000;
const DONE_STORE_KEY = "ic_done_usernames";
const RESULT_STORE_KEY = "ic_results";
const RECOVERABLE_RUN_STATES = new Set(["running", "paused", "stopping"]);

function isBusy() {
  return BUSY_STATES.has(state);
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "ping") {
    sendResponse({ ok: true, loggedIn: InstagramAPI.isLoggedIn(), state });
    return true;
  }

  if (msg.action === "login_check") {
    sendResponse({ loggedIn: InstagramAPI.isLoggedIn() });
    return true;
  }

  if (msg.action === "start") {
    if (isBusy()) {
      sendResponse({ ok: false, reason: "already_running", state });
      return true;
    }
    state = "running";
    processUsernames(msg.usernames, msg.config).catch(handleUnexpectedRunError);
    sendResponse({ ok: true });
    return true;
  }

  if (msg.action === "pause") {
    if (state !== "running") { sendResponse({ ok: false, reason: "not_running", state }); return true; }
    state = "paused";
    updateStoredStatus("paused");
    sendResponse({ ok: true, state });
    return true;
  }
  if (msg.action === "resume") {
    if (state !== "paused") { sendResponse({ ok: false, reason: "not_paused", state }); return true; }
    state = "running";
    updateStoredStatus("running");
    sendResponse({ ok: true, state });
    return true;
  }
  if (msg.action === "stop") {
    if (state === "stopping") { sendResponse({ ok: true, state }); return true; }
    if (state !== "running" && state !== "paused") { sendResponse({ ok: false, reason: "not_running", state }); return true; }
    state = "stopping";
    wakeCurrentWait();
    updateStoredStatus("stopping");
    sendResponse({ ok: true, state });
    return true;
  }
  if (msg.action === "wake") {
    wakeCurrentWait();
    sendResponse({ ok: true, state });
    return true;
  }
  if (msg.action === "get_state") { sendResponse({ state }); return true; }
  if (msg.action === "clear_progress") {
    state = "idle";
    recentLog = [];
    activeRunUsernames = [];
    activeRunConfig = null;
    activeRunStartedAt = null;
    activeRunAttempted = [];
    stopHeartbeat();
    wakeCurrentWait();
    chrome.storage.local.remove("ic_state", () => sendResponse({ ok: true }));
    return true;
  }

  if (msg.action === "ui_cancel_profile") {
    cancelCurrentProfileViaUi(msg.username, msg.mode).then(sendResponse);
    return true;
  }
});

function send(data) {
  try { chrome.runtime.sendMessage(data); } catch { /* popup may be closed */ }
}

function formatError(error) {
  return (error?.stack || error?.message || String(error || "Onbekende fout")).slice(0, 500);
}

function handleUnexpectedRunError(error) {
  const detail = formatError(error);
  rememberLog({
    username: "system",
    status: "failed",
    detail: `Interne fout: ${detail}`,
  });
  state = "idle";
  stopHeartbeat();
  chrome.storage.local.get("ic_state", (res) => {
    const current = res.ic_state || {};
    chrome.storage.local.set({
      ic_state: {
        ...current,
        status: "error",
        error: detail,
        log: recentLog,
        updatedAt: new Date().toISOString(),
      },
    });
  });
  send({
    action: "error",
    message: `InstaClean stopte door een interne fout: ${detail}`,
  });
}

function getReasonMessage(reason) {
  switch (reason) {
    case "not_found": return "Account niet gevonden";
    case "not_requested": return "Geen pending request meer";
    case "already_following": return "Request al geaccepteerd";
    case "verification_failed": return "Instagram bevestigde de annulering niet";
    case "timeout": return "Timeout";
    case "rate_limited": return "Rate limited";
    case "instagram_blocked": return "Instagram blokkeert deze request";
    case "feedback_required": return "Instagram vraagt cooldown";
    case "auth_required": return "Instagram login verlopen";
    case "checkpoint_required": return "Instagram checkpoint nodig";
    case "challenge_required": return "Instagram challenge nodig";
    case "csrf_rejected": return "Instagram sessie-token geweigerd";
    case "instagram_unavailable": return "Instagram tijdelijk niet beschikbaar";
    case "bad_request": return "Instagram accepteert deze request niet";
    case "http_error": return "Instagram API fout";
    case "request_failed": return "Netwerk/request fout";
    case "no_id": return "Geen Instagram user-id gevonden";
    case "no_csrf": return "Niet ingelogd";
    case "ui_button_not_found": return "Requested knop niet gevonden";
    case "ui_fallback_failed": return "UI fallback mislukte";
    case "profile_api_cooling_down": return "Profiel-check tijdelijk gepauzeerd";
    case "unknown_error": return "Geen foutdetails ontvangen";
    default: return `Fout (${reason || "geen reden"})`;
  }
}

function isRetryableFailure(result) {
  return !!result?.retryable || ["rate_limited", "feedback_required", "instagram_unavailable", "request_failed", "timeout"].includes(result?.reason);
}

function isFatalFailure(result) {
  return !!result?.fatal || ["auth_required", "checkpoint_required", "challenge_required", "csrf_rejected", "no_csrf"].includes(result?.reason);
}

function describeBlock(result) {
  const status = result?.status ? `HTTP ${result.status}` : "geen status";
  const stage = result?.stage === "profile"
    ? "profiel-check"
    : result?.stage === "cancel_web"
      ? "cancel-call"
      : result?.stage === "cancel_destroy"
        ? "fallback cancel-call"
        : "Instagram-call";

  return `${getReasonMessage(result?.reason)} op de ${stage} (${status})`;
}

function getFailureDetail(result) {
  if (!result) return "";
  if (result.detail) return result.detail;
  if (result.status && result.stage) return `${result.stage} HTTP ${result.status}`;
  if (result.status) return `HTTP ${result.status}`;
  return "";
}

function canUseUiFallback(result) {
  if (!result || isFatalFailure(result)) return false;
  return ["instagram_blocked", "bad_request", "http_error", "request_failed", "timeout", "no_id", "verification_failed"].includes(result.reason);
}

function isProfileCooldown(result) {
  return result?.stage === "profile" && ["rate_limited", "feedback_required"].includes(result?.reason);
}

function canUseProfileUiFallback(result) {
  return canUseUiFallback(result) || isProfileCooldown(result) || result?.reason === "profile_api_cooling_down";
}

function isSkippedReason(reason) {
  return ["not_found", "not_requested", "already_following"].includes(reason);
}

function combineFallbackDetail(original, fallback) {
  const fallbackDetail = getFailureDetail(fallback);
  const originalDetail = getFailureDetail(original);
  if (!fallbackDetail) return originalDetail ? `UI fallback gaf geen detail | API: ${originalDetail}` : "";
  if (!originalDetail || fallbackDetail.includes(originalDetail)) return fallbackDetail;
  return `${fallbackDetail} | API: ${originalDetail}`.slice(0, 320);
}

function requestUiFallback(username, mode = "cancel", progressContext = null) {
  if (progressContext) {
    rememberLog({
      username,
      status: "live",
      detail: "LIVE profiel geopend voor zichtbare knop-check",
    });
    saveProgress(progressContext.completed, progressContext.stats, null, {
      current: progressContext.current,
      total: progressContext.total,
      currentUsername: username,
      phase: "live_fallback",
    });
  }

  send({
    action: "ui_fallback_live",
    username,
    mode,
    message: `Live UI fallback opent @${username}`,
  });

  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: "ui_fallback_cancel", username, mode }, (response) => {
      if (chrome.runtime.lastError) {
        resolve({
          ok: false,
          reason: "ui_fallback_failed",
          stage: "ui_fallback",
          detail: `ui_fallback: ${chrome.runtime.lastError.message}`,
          retryable: false,
          fatal: false,
        });
        return;
      }

      resolve(response || {
        ok: false,
        reason: "ui_fallback_failed",
        stage: "ui_fallback",
        detail: "ui_fallback: geen response van achtergrondscript",
        retryable: false,
        fatal: false,
      });
    });
  });
}

function normalizeText(value) {
  return (value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function isVisible(el) {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  const style = window.getComputedStyle(el);
  return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
}

function getClickableElements() {
  return [...document.querySelectorAll("button, a, div[role='button'], span[role='button']")].filter(isVisible);
}

function findClickableByText(texts) {
  const normalizedTexts = texts.map(normalizeText);
  return getClickableElements().find((el) => {
    const text = normalizeText(el.innerText || el.textContent);
    return normalizedTexts.some((target) => text === target || text.includes(target));
  });
}

function waitForCondition(check, timeoutMs = 12000, intervalMs = 250) {
  return new Promise((resolve) => {
    const started = Date.now();
    const timer = setInterval(() => {
      const value = check();
      if (value) {
        clearInterval(timer);
        resolve(value);
        return;
      }

      if (Date.now() - started > timeoutMs) {
        clearInterval(timer);
        resolve(null);
      }
    }, intervalMs);
  });
}

async function cancelCurrentProfileViaUi(username, mode = "cancel") {
  const requestedTexts = ["requested", "aangevraagd", "gevraagd", "verzoek verzonden"];
  const confirmTexts = [
    "unfollow",
    "cancel request",
    "cancel follow request",
    "remove request",
    "verzoek annuleren",
    "aanvraag annuleren",
    "niet meer volgen",
  ];

  const requestedButton = await waitForCondition(() => findClickableByText(requestedTexts), 15000);
  if (!requestedButton) {
    const pageText = normalizeText(document.body?.innerText || document.body?.textContent || "");
    if (pageText.includes("sorry, this page isn't available") || pageText.includes("pagina is niet beschikbaar")) {
      return {
        ok: false,
        reason: "not_found",
        stage: "ui_fallback",
        detail: `ui_fallback: profielpagina voor @${username} bestaat niet of is niet beschikbaar`,
      };
    }

    if (mode === "verify_after_cancel") {
      return {
        ok: true,
        via: "ui_fallback",
        detail: `ui_fallback: @${username} toont geen Requested knop meer`,
      };
    }

    return {
      ok: false,
      reason: "not_requested",
      stage: "ui_fallback",
      detail: `ui_fallback: geen Requested knop gevonden voor @${username}; waarschijnlijk niet pending of al afgehandeld`,
      retryable: false,
      fatal: false,
    };
  }

  requestedButton.click();
  await sleep(900);

  const confirmButton = findClickableByText(confirmTexts);
  if (confirmButton) {
    confirmButton.click();
    await sleep(1200);
  }

  const requestedGone = await waitForCondition(() => !findClickableByText(requestedTexts), 7000, 300);
  if (requestedGone) {
    return {
      ok: true,
      via: "ui_fallback",
      detail: `ui_fallback: Requested knop verdween voor @${username}`,
    };
  }

  return {
    ok: false,
    reason: "verification_failed",
    stage: "ui_fallback",
    detail: `ui_fallback: Requested knop bleef zichtbaar voor @${username}`,
    retryable: false,
    fatal: false,
  };
}

function sendProgress({ username, status, reason = "", reasonDetail = "", current, total, cancelled, skipped, failed, eta, speed }) {
  send({
    action: "progress",
    username,
    status,
    reason,
    reasonLabel: reason ? getReasonMessage(reason) : "",
    reasonDetail,
    current,
    total,
    cancelled,
    skipped,
    failed,
    eta,
    speed,
  });
}

function rememberLog(entry) {
  recentLog = [{ ts: Date.now(), ...entry }, ...recentLog].slice(0, 50);
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function normalizeRunConfig(config = {}) {
  return {
    delay: clampNumber(config.delay, 15000, MAX_ACTION_DELAY_MS, DEFAULT_RUN_CONFIG.delay),
    batchSize: Math.round(clampNumber(config.batchSize, 3, 10, DEFAULT_RUN_CONFIG.batchSize)),
    batchPause: clampNumber(config.batchPause, 180000, MAX_BATCH_PAUSE_MS, DEFAULT_RUN_CONFIG.batchPause),
  };
}

function getSafeUsernames(usernames) {
  if (!Array.isArray(usernames)) return [];
  const seen = new Set();
  return usernames
    .map((username) => String(username || "").trim().replace(/^@+/, "").toLowerCase())
    .filter((username) => {
      if (!username || seen.has(username)) return false;
      seen.add(username);
      return true;
    });
}

function normalizeUsername(username) {
  return String(username || "").trim().replace(/^@+/, "").replace(/\/+$/, "").toLowerCase();
}

function storageGet(keys) {
  return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
}

function storageSet(data) {
  return new Promise((resolve) => chrome.storage.local.set(data, resolve));
}

function isDoneRecordStatus(status) {
  return status === "success" || status === "skipped" || status === "done";
}

async function loadDoneRecords(storedState = null) {
  const stored = await storageGet(DONE_STORE_KEY);
  const rawRecords = stored[DONE_STORE_KEY] || {};
  const records = {};

  for (const [rawUsername, rawRecord] of Object.entries(rawRecords)) {
    const username = normalizeUsername(rawUsername);
    if (!username) continue;
    const record = rawRecord && typeof rawRecord === "object" ? rawRecord : {};
    const status = isDoneRecordStatus(record.status) ? record.status : "done";
    records[username] = {
      status,
      reason: record.reason || "",
      detail: record.detail || "",
      ts: record.ts || Date.now(),
    };
  }

  // Backward compatibility for progress saved before the durable done store existed.
  for (const rawUsername of storedState?.completed || []) {
    const username = normalizeUsername(rawUsername);
    if (!username || records[username]) continue;
    records[username] = {
      status: "done",
      reason: "previous_progress",
      detail: "Eerder verwerkt door InstaClean",
      ts: Date.parse(storedState?.updatedAt || storedState?.startedAt || "") || Date.now(),
    };
  }

  return records;
}

function countDoneRecords(records, statuses) {
  const wanted = new Set(statuses);
  return Object.values(records).filter((record) => wanted.has(record.status)).length;
}

async function persistDoneResult(username, status, result = {}) {
  if (status !== "success" && status !== "skipped") return;

  const safeUsername = normalizeUsername(username);
  if (!safeUsername) return;

  try {
    const stored = await storageGet(DONE_STORE_KEY);
    const records = stored[DONE_STORE_KEY] || {};
    records[safeUsername] = {
      status,
      reason: result?.reason || "",
      detail: result?.detail || "",
      ts: Date.now(),
    };
    await storageSet({ [DONE_STORE_KEY]: records });
  } catch {
    // Progress in ic_state still gets saved; the durable index is best effort.
  }
}

async function persistAuditResult(username, status, result = {}) {
  const safeUsername = normalizeUsername(username);
  if (!safeUsername) return;

  try {
    const stored = await storageGet(RESULT_STORE_KEY);
    const results = stored[RESULT_STORE_KEY] || {};
    results[safeUsername] = {
      username: safeUsername,
      status,
      reason: result?.reason || "",
      detail: result?.detail || "",
      via: result?.via || result?.stage || "",
      verified: status === "success" || status === "skipped",
      ts: new Date().toISOString(),
      runStartedAt: activeRunStartedAt,
    };
    await storageSet({ [RESULT_STORE_KEY]: results });
  } catch {
    // The visible run can continue even if audit persistence fails once.
  }
}

function getVerifiedDetail(status, result = {}) {
  if (result.detail) return result.detail;
  if (status === "success") return "Geverifieerd: Requested is weg";
  if (status === "skipped") {
    if (result.reason === "not_requested") return "Geverifieerd: Instagram meldt geen pending follow request";
    if (result.reason === "already_following") return "Geverifieerd: je volgt dit account al";
    if (result.reason === "not_found") return "Geverifieerd: account bestaat niet of is niet beschikbaar";
    return "Geverifieerd: geen open request meer";
  }
  return getFailureDetail(result);
}

function shouldResumeStoredRun(storedState) {
  return RECOVERABLE_RUN_STATES.has(storedState?.status)
    && Array.isArray(storedState?.usernames)
    && storedState.usernames.length > 0;
}

function getStoredRunProcessed(storedState, safeUsernames, completed) {
  if (!shouldResumeStoredRun(storedState)) return new Set();

  const rawProcessed = Array.isArray(storedState.runProcessed)
    ? storedState.runProcessed
    : Array.isArray(storedState.attempted)
      ? storedState.attempted
      : [];
  const safeSet = new Set(safeUsernames);
  const processed = new Set(
    rawProcessed
      .map(normalizeUsername)
      .filter((username) => username && safeSet.has(username))
  );

  const stats = storedState.stats || {};
  const countedResults = (Number(stats.cancelled) || 0) + (Number(stats.skipped) || 0) + (Number(stats.failed) || 0);

  // Older builds sometimes saved hundreds of opened profiles as "attempted" without
  // recording final results. Treat that as stale/corrupt so we do not skip real work.
  if (countedResults > 0 && processed.size > countedResults + 5) {
    return new Set([...processed].filter((username) => completed.has(username)));
  }

  return processed;
}

function startHeartbeat() {
  stopHeartbeat();
  heartbeatTimer = setInterval(() => {
    if (!isBusy()) return;
    chrome.storage.local.get("ic_state", (res) => {
      const current = res.ic_state;
      if (!current) return;
      const updatedAt = new Date().toISOString();
      const nextState = { ...current, status: state === "paused" ? "paused" : state === "stopping" ? "stopping" : "running", updatedAt };
      chrome.storage.local.set({ ic_state: nextState });
      send({
        action: "heartbeat",
        current: nextState.current,
        total: nextState.total,
        username: nextState.currentUsername,
        phase: nextState.phase,
        status: nextState.status,
        updatedAt,
      });
    });
  }, 5000);
}

function stopHeartbeat() {
  if (!heartbeatTimer) return;
  clearInterval(heartbeatTimer);
  heartbeatTimer = null;
}

function wakeCurrentWait() {
  if (!waitWakeResolver) return;
  const resolve = waitWakeResolver;
  waitWakeResolver = null;
  resolve();
}

function waitForTimerOrWake(ms) {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (waitWakeResolver === finish) waitWakeResolver = null;
      resolve();
    };

    const timer = setTimeout(finish, Math.max(0, ms));
    waitWakeResolver = finish;
  });
}

async function waitUntilResumedOrStopped() {
  while (state === "paused") {
    await waitForTimerOrWake(300);
  }
  return state !== "stopping";
}

async function waitInterruptibly(ms, options = {}) {
  const requestedMs = Math.max(0, Number(ms) || 0);
  const maxMs = Number.isFinite(options.maxMs) ? Math.max(0, options.maxMs) : requestedMs;
  const deadline = Date.now() + Math.min(requestedMs, maxMs);

  while (Date.now() < deadline) {
    if (state === "stopping") return false;

    if (state === "paused") {
      const resumed = await waitUntilResumedOrStopped();
      if (!resumed) return false;
    }

    const step = Math.min(1000, Math.max(0, deadline - Date.now()));
    await waitForTimerOrWake(step);
  }

  return state !== "stopping";
}

async function processUsernames(usernames, config) {
  const settings = normalizeRunConfig(config);
  const safeUsernames = getSafeUsernames(usernames);
  const safeUsernameSet = new Set(safeUsernames);
  // Load progress from storage
  const stored = await new Promise(r => chrome.storage.local.get("ic_state", res => r(res.ic_state)));
  const allDoneRecords = await loadDoneRecords(stored);
  const doneRecords = Object.fromEntries(
    Object.entries(allDoneRecords).filter(([username]) => safeUsernameSet.has(username))
  );
  const completed = new Set(Object.keys(doneRecords));
  const attempted = getStoredRunProcessed(stored, safeUsernames, completed);
  const remaining = safeUsernames.filter(u => !completed.has(u) && !attempted.has(u));
  const resumeStoredRun = shouldResumeStoredRun(stored);
  recentLog = resumeStoredRun && Array.isArray(stored?.log) ? stored.log.slice(0, 50) : [];
  activeRunUsernames = safeUsernames;
  activeRunConfig = settings;
  activeRunStartedAt = resumeStoredRun ? (stored?.startedAt || new Date().toISOString()) : new Date().toISOString();
  activeRunAttempted = [...attempted];

  const storedStats = stored?.stats || {};
  const knownCancelled = countDoneRecords(doneRecords, ["success"]);
  const knownSkipped = countDoneRecords(doneRecords, ["skipped", "done"]);
  let cancelled = Math.max(knownCancelled, resumeStoredRun ? (Number(storedStats.cancelled) || 0) : 0);
  let skipped = Math.max(knownSkipped, resumeStoredRun ? (Number(storedStats.skipped) || 0) : 0);
  let failed = resumeStoredRun ? Math.max(0, Number(storedStats.failed) || 0) : 0;
  let rateLimitCount = 0;
  let consecutiveHardFailures = 0;
  let currentDelay = settings.delay;
  let profileApiCooldownUntil = 0;
  const startTime = Date.now();
  const totalCount = safeUsernames.length;
  const processedCount = () => new Set([...completed, ...attempted]).size;

  const pauseForHardFailures = async (result) => {
    state = "paused";
    send({
      action: "rate_limit_pause",
      message: isFatalFailure(result)
        ? `${getReasonMessage(result?.reason)}. Los dit eerst op en klik daarna op Hervat. Detail: ${getFailureDetail(result)}`
        : `Te veel fouten achter elkaar. Laatste fout: ${getFailureDetail(result) || getReasonMessage(result?.reason)}. Klik Hervat na controle.`,
      status: result?.status,
      stage: result?.stage,
    });

    const resumed = await waitUntilResumedOrStopped();
    if (!resumed) return false;

    consecutiveHardFailures = 0;
    currentDelay = Math.max(currentDelay, 10000);
    return true;
  };

  const pauseForFailureRate = async (result) => {
    const processed = cancelled + skipped + failed;
    if (processed < 20) return true;

    const failureRate = failed / processed;
    if (failureRate < 0.35) return true;

    state = "paused";
    send({
      action: "rate_limit_pause",
      message: `Te veel mislukkingen (${Math.round(failureRate * 100)}%). Laatste fout: ${getFailureDetail(result) || getReasonMessage(result?.reason)}. Controleer dit voor je verdergaat.`,
      status: result?.status,
      stage: result?.stage,
    });

    const resumed = await waitUntilResumedOrStopped();
    if (!resumed) return false;

    consecutiveHardFailures = 0;
    currentDelay = Math.max(currentDelay, 12000);
    return true;
  };

  const handleRateLimit = async (result) => {
    rateLimitCount++;
    currentDelay = Math.min(Math.max(currentDelay * 1.5, currentDelay + 1000), 30000);

    const retryAfterMs = result?.retryAfterMs;
    const waitMs = retryAfterMs && retryAfterMs > 0
      ? Math.max(retryAfterMs, 60000)
      : Math.min(rateLimitCount * 60000, MAX_RATE_LIMIT_WAIT_MS);

    if (rateLimitCount >= 3) {
      state = "paused";
      send({
        action: "rate_limit_pause",
        message: `${describeBlock(result)}. Wacht 10-15 min en klik daarna op Hervat.`,
        status: result?.status,
        stage: result?.stage,
      });

      const resumed = await waitUntilResumedOrStopped();
      if (!resumed) return false;

      rateLimitCount = 1;
      return true;
    }

    send({
      action: "rate_limit",
      message: `${describeBlock(result)}. Wachten ${Math.round(waitMs / 1000)}s en daarna opnieuw proberen...`,
      waitMs,
      status: result?.status,
      stage: result?.stage,
    });

    return waitInterruptibly(waitMs, { maxMs: MAX_RATE_LIMIT_WAIT_MS });
  };

  const startProfileApiCooldown = (result) => {
    const retryAfterMs = result?.retryAfterMs;
    const waitMs = retryAfterMs && retryAfterMs > 0
      ? Math.max(retryAfterMs, 60000)
      : 180000;

    profileApiCooldownUntil = Date.now() + waitMs;
    currentDelay = Math.max(currentDelay, 9000);

    send({
      action: "rate_limit",
      message: `${describeBlock(result)}. API tijdelijk gepauzeerd; ik probeer nu via de zichtbare Instagram-knop.`,
      waitMs,
      status: result?.status,
      stage: result?.stage,
    });

    return waitMs;
  };

  const recordFinalResult = async (username, result, done, eta, speed) => {
    const success = !!result?.ok;
    const skippedResult = !success && isSkippedReason(result?.reason);

    if (success) {
      cancelled++;
      consecutiveHardFailures = 0;
      completed.add(username);
    } else if (skippedResult) {
      skipped++;
      consecutiveHardFailures = 0;
      completed.add(username);
    } else {
      failed++;
      consecutiveHardFailures++;
    }
    attempted.add(username);
    activeRunAttempted = [...attempted];

    const status = success ? "success" : (skippedResult ? "skipped" : "failed");
    const detail = getVerifiedDetail(status, result);
    await persistDoneResult(username, status, { ...result, detail });
    await persistAuditResult(username, status, { ...result, detail });

    rememberLog({
      username,
      status,
      detail,
    });

    const currentProcessed = processedCount();
    saveProgress(completed, { cancelled, skipped, failed }, null, {
      current: currentProcessed,
      total: totalCount,
      currentUsername: username,
    });
    sendProgress({
      username,
      status,
      reason: success ? "" : (result?.reason || "unknown_error"),
      reasonDetail: detail,
      current: currentProcessed,
      total: totalCount,
      cancelled,
      skipped,
      failed,
      eta,
      speed,
    });

    if (!success && !skippedResult) {
      if (isFatalFailure(result) || consecutiveHardFailures >= 5) {
        const shouldContinue = await pauseForHardFailures(result);
        if (!shouldContinue) return false;
      }

      const failureRateOk = await pauseForFailureRate(result);
      if (!failureRateOk) return false;
    }

    return true;
  };

  if (!InstagramAPI.isLoggedIn()) {
    send({ action: "error", message: "Niet ingelogd op Instagram. Log in en probeer opnieuw." });
    state = "idle";
    return;
  }

  if (remaining.length === 0) {
    saveProgress(completed, { cancelled, skipped, failed }, "completed", {
      current: processedCount(),
      total: totalCount,
      currentUsername: "",
      phase: "completed",
    });
    send({ action: "already_done", previouslyCompleted: completed.size, total: totalCount });
    state = "idle";
    stopHeartbeat();
    return;
  }

  send({ action: "started", total: totalCount, previouslyCompleted: completed.size, resumed: completed.size > 0 });
  saveProgress(completed, { cancelled, skipped, failed }, "running", {
    current: processedCount(),
    total: totalCount,
    currentUsername: "",
  });
  startHeartbeat();

  for (let i = 0; i < remaining.length; i++) {
    // Pause loop
    while (state === "paused") await waitForTimerOrWake(300);
    if (state === "stopping") break;

    const username = remaining[i];
    const done = processedCount();
    const progressContext = {
      completed,
      stats: { cancelled, skipped, failed },
      current: done,
      total: totalCount,
    };

    // Batch pause
    if (i > 0 && i % settings.batchSize === 0) {
      const nextWakeAt = new Date(Date.now() + settings.batchPause).toISOString();
      send({ action: "batch_pause", pauseMs: settings.batchPause, processed: i, nextWakeAt });
      saveProgress(completed, { cancelled, skipped, failed }, null, {
        current: done,
        total: totalCount,
        currentUsername: "",
        phase: "batch_pause",
        nextWakeAt,
      });
      const shouldContinue = await waitInterruptibly(settings.batchPause, { maxMs: MAX_BATCH_PAUSE_MS });
      if (!shouldContinue) break;
    }

    // ETA
    const elapsed = Date.now() - startTime;
    const perItem = done > 0 ? elapsed / done : 2500;
    const etaMs = perItem * Math.max(0, totalCount - done);
    const etaMins = Math.round(etaMs / 60000);
    const eta = etaMins < 1 ? "< 1 min" : `~${etaMins} min`;
    const speed = done > 0 ? Math.round(done / (elapsed / 60000)) : 0;

    saveProgress(completed, { cancelled, skipped, failed }, null, {
      current: done,
      total: totalCount,
      currentUsername: username,
      phase: "profile_check",
    });

    // Step 1: Load current relationship state
    let profileResult = null;
    if (Date.now() < profileApiCooldownUntil) {
      const secondsLeft = Math.ceil((profileApiCooldownUntil - Date.now()) / 1000);
      profileResult = {
        ok: false,
        reason: "profile_api_cooling_down",
        stage: "profile",
        detail: `profile: API in cooldown, nog ongeveer ${secondsLeft}s. UI fallback wordt geprobeerd.`,
        retryable: false,
        fatal: false,
      };
    } else {
      while (true) {
        profileResult = await InstagramAPI.getUserProfile(username);
        if (profileResult.ok || !isRetryableFailure(profileResult)) break;

        if (isProfileCooldown(profileResult)) {
          startProfileApiCooldown(profileResult);
          break;
        }

        const shouldContinue = await handleRateLimit(profileResult);
        if (!shouldContinue) break;
      }
    }

    if (state === "stopping") break;

    if (!profileResult.ok) {
      let finalResult = profileResult;
      if (canUseProfileUiFallback(profileResult)) {
        const uiResult = await requestUiFallback(username, "cancel", progressContext);
        finalResult = uiResult.ok || isSkippedReason(uiResult.reason)
          ? uiResult
          : { ...uiResult, detail: combineFallbackDetail(profileResult, uiResult) };
      }

      const shouldContinue = await recordFinalResult(username, finalResult, done, eta, speed);
      if (!shouldContinue) break;
      if (!(await waitInterruptibly(currentDelay, { maxMs: MAX_ACTION_DELAY_MS }))) break;
      continue;
    }

    if (!profileResult.requested) {
      const finalResult = profileResult.requestedKnown === false
        ? await requestUiFallback(username, "cancel", progressContext)
        : {
            ok: false,
            reason: profileResult.followedByViewer ? "already_following" : "not_requested",
            stage: "profile",
            detail: profileResult.followedByViewer
              ? "profile: Instagram meldt dat je dit account al volgt"
              : "profile: Instagram meldt geen pending follow request",
          };

      const shouldContinue = await recordFinalResult(username, finalResult, done, eta, speed);
      if (!shouldContinue) break;
      if (!(await waitInterruptibly(currentDelay, { maxMs: MAX_ACTION_DELAY_MS }))) break;
      continue;
    }

    // Step 2: Cancel follow request
    saveProgress(completed, { cancelled, skipped, failed }, null, {
      current: done,
      total: totalCount,
      currentUsername: username,
      phase: "api_cancel",
    });
    let cancelResult = null;
    while (true) {
      cancelResult = await InstagramAPI.cancelFollowRequest(profileResult.id, username);
      if (cancelResult.ok || !isRetryableFailure(cancelResult)) break;

      const shouldContinue = await handleRateLimit(cancelResult);
      if (!shouldContinue) break;
    }

    if (state === "stopping") break;

    if (!cancelResult.ok && canUseUiFallback(cancelResult)) {
      const uiResult = await requestUiFallback(username, "verify_after_cancel", progressContext);
      cancelResult = uiResult.ok || isSkippedReason(uiResult.reason)
        ? uiResult
        : { ...uiResult, detail: combineFallbackDetail(cancelResult, uiResult) };
    }

    const shouldContinue = await recordFinalResult(username, cancelResult, done, eta, speed);
    if (!shouldContinue) break;

    // Recovery after successes
    if ((cancelled + skipped) % 15 === 0 && rateLimitCount > 0) {
      rateLimitCount = Math.max(0, rateLimitCount - 1);
      currentDelay = Math.max(settings.delay, currentDelay * 0.8);
    }

    if (!(await waitInterruptibly(currentDelay, { maxMs: MAX_ACTION_DELAY_MS }))) break;
  }

  // Done
  const durationMs = Date.now() - startTime;
  const processedTotal = processedCount();
  const finalStatus = state === "stopping" ? "stopped" : "completed";
  send({ action: "done", cancelled, skipped, failed, total: totalCount, durationMs, status: finalStatus, stopped: finalStatus === "stopped" });
  saveProgress(completed, { cancelled, skipped, failed }, finalStatus, {
    current: processedTotal,
    total: totalCount,
    currentUsername: "",
    phase: finalStatus,
  });
  stopHeartbeat();

  // Save history
  const history = await new Promise(r => chrome.storage.local.get("ic_history", res => r(res.ic_history || [])));
  history.unshift({ date: new Date().toISOString(), total: totalCount, cancelled, skipped, failed, durationMs, status: finalStatus });
  chrome.storage.local.set({ ic_history: history.slice(0, 20) });

  state = "idle";
}

function updateStoredStatus(status) {
  chrome.storage.local.get("ic_state", (res) => {
    if (!res.ic_state) return;
    chrome.storage.local.set({ ic_state: { ...res.ic_state, status, updatedAt: new Date().toISOString() } });
  });
}

function saveProgress(completed, stats, statusOverride = null, meta = {}) {
  const hasCurrent = typeof meta.current === "number" && Number.isFinite(meta.current);
  const hasTotal = typeof meta.total === "number" && Number.isFinite(meta.total);
  const current = hasCurrent ? meta.current : (typeof stats.current === "number" ? stats.current : completed.size);
  const total = hasTotal ? meta.total : (typeof stats.total === "number" ? stats.total : null);
  const storedStats = { ...stats, current };
  if (total !== null) storedStats.total = total;

  chrome.storage.local.set({
    ic_state: {
      status: statusOverride || (state === "paused" ? "paused" : state === "stopping" ? "stopping" : "running"),
      usernames: activeRunUsernames,
      config: activeRunConfig,
      startedAt: activeRunStartedAt,
      completed: [...completed],
      attempted: activeRunAttempted,
      runProcessed: activeRunAttempted,
      stats: storedStats,
      current,
      total,
      currentUsername: meta.currentUsername || "",
      phase: meta.phase || "",
      nextWakeAt: meta.nextWakeAt || null,
      log: recentLog,
      updatedAt: new Date().toISOString(),
    }
  });
}
