// InstaClean Background Service Worker
// Routes messages between: Website ↔ Background ↔ Content Script ↔ Popup

let activeTabId = null;
let runnerTabId = null;
let websiteTabId = null;
let liveFallbackTabId = null;
let liveFallbackTabLock = null;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const TAB_STATE_KEY = "ic_tab_roles";
const LIVE_FALLBACK_PARAM = "ic_live";
const STALE_BATCH_WAKE_MS = 150000;
const UI_FALLBACK_RESPONSE_TIMEOUT_MS = 30000;

const PROFILE_ROUTE_BLOCKLIST = new Set([
  "accounts",
  "api",
  "challenge",
  "direct",
  "explore",
  "p",
  "reel",
  "reels",
  "stories",
]);

function isLikelyProfileUrl(url) {
  try {
    const parsed = new URL(url || "");
    const parts = parsed.pathname.split("/").filter(Boolean);
    return parts.length === 1 && !PROFILE_ROUTE_BLOCKLIST.has(parts[0].toLowerCase());
  } catch {
    return false;
  }
}

function isSafeRunnerTab(tab) {
  return tab?.url?.includes("instagram.com") && !isLikelyProfileUrl(tab.url);
}

async function loadTabRoles() {
  try {
    const stored = await chrome.storage.local.get(TAB_STATE_KEY);
    const roles = stored[TAB_STATE_KEY] || {};
    if (!runnerTabId && roles.runnerTabId) runnerTabId = roles.runnerTabId;
    if (!liveFallbackTabId && roles.liveFallbackTabId) liveFallbackTabId = roles.liveFallbackTabId;
    if (!websiteTabId && roles.websiteTabId) websiteTabId = roles.websiteTabId;
  } catch {
    // Storage is best-effort; runtime state still works within the same service worker lifetime.
  }
}

async function saveTabRoles() {
  try {
    await chrome.storage.local.set({
      [TAB_STATE_KEY]: {
        runnerTabId,
        liveFallbackTabId,
        websiteTabId,
      },
    });
  } catch {}
}

async function setRunnerTabId(tabId) {
  runnerTabId = tabId || null;
  activeTabId = tabId || null;
  await saveTabRoles();
}

async function setLiveFallbackTabId(tabId) {
  liveFallbackTabId = tabId || null;
  await saveTabRoles();
}

async function setWebsiteTabId(tabId) {
  websiteTabId = tabId || null;
  await saveTabRoles();
}

async function forwardToWebsite(msg) {
  await loadTabRoles();
  if (!websiteTabId) return;
  try { chrome.tabs.sendMessage(websiteTabId, { ...msg, source: "extension" }); } catch {}
}

// ── Find Instagram tab ──
async function findInstagramTab({ excludeLive = true, safeRunnerOnly = false } = {}) {
  await loadTabRoles();
  const tabs = await chrome.tabs.query({ url: "https://www.instagram.com/*" });
  let candidates = excludeLive && liveFallbackTabId
    ? tabs.filter((tab) => tab.id !== liveFallbackTabId)
    : tabs;

  if (safeRunnerOnly) {
    candidates = candidates.filter(isSafeRunnerTab);
  }

  return candidates.length > 0 ? candidates[0].id : null;
}

async function probeContentState(tabId) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { action: "get_state" });
    return response?.state || null;
  } catch {
    return null;
  }
}

async function findRunningInstagramTab() {
  await loadTabRoles();
  const tabs = await chrome.tabs.query({ url: "https://www.instagram.com/*" });
  const candidateIds = [runnerTabId, activeTabId].filter((id, index, arr) => id && id !== liveFallbackTabId && arr.indexOf(id) === index);
  const ordered = [
    ...candidateIds.flatMap((id) => tabs.filter((tab) => tab.id === id)),
    ...tabs.filter((tab) => !candidateIds.includes(tab.id) && tab.id !== liveFallbackTabId),
  ];

  let idleTabId = null;
  for (const tab of ordered) {
    const contentState = await probeContentState(tab.id);
    if ((contentState === "running" || contentState === "paused" || contentState === "stopping") && isSafeRunnerTab(tab)) {
      await setRunnerTabId(tab.id);
      return { tabId: tab.id, contentState };
    }
    if (!idleTabId && contentState === "idle" && isSafeRunnerTab(tab)) {
      idleTabId = tab.id;
    }
  }

  if (idleTabId) {
    await setRunnerTabId(idleTabId);
    return { tabId: idleTabId, contentState: "idle" };
  }

  return { tabId: null, contentState: null };
}

async function ensureRunnerTab({ createIfMissing = false } = {}) {
  await loadTabRoles();
  const candidateIds = [runnerTabId, activeTabId].filter((id, index, arr) => id && id !== liveFallbackTabId && arr.indexOf(id) === index);
  for (const id of candidateIds) {
    let tab = null;
    try {
      tab = await chrome.tabs.get(id);
    } catch {
      continue;
    }
    if (!isSafeRunnerTab(tab)) continue;

    const state = await probeContentState(id);
    if (state) {
      await setRunnerTabId(id);
      return id;
    }
  }

  const existing = await findInstagramTab({ excludeLive: true, safeRunnerOnly: true });
  if (existing) {
    await setRunnerTabId(existing);
    return existing;
  }

  if (!createIfMissing) return null;

  const tab = await chrome.tabs.create({ url: "https://www.instagram.com/", active: false });
  await setRunnerTabId(tab.id);
  await waitForTabComplete(tab.id, 30000, "https://www.instagram.com/");
  await delay(1000);
  return tab.id;
}

async function getRuntimeState() {
  const stored = await chrome.storage.local.get("ic_state");
  const storedState = stored.ic_state || null;
  let runner = await findRunningInstagramTab();
  let recovery = null;

  if (shouldAutoRecoverRun(storedState, runner)) {
    recovery = await resumeStoredRun(storedState, "auto_recover_get_state");
    runner = await findRunningInstagramTab();
  }

  const staleWake = await maybeWakeStalledRunner(stored.ic_state, runner);
  return {
    state: storedState,
    tabId: runner.tabId,
    contentState: runner.contentState,
    liveFallbackTabId,
    recovery,
    staleWake,
  };
}

function isRuntimeBusyState(value) {
  return value === "running" || value === "paused" || value === "stopping";
}

function hasPersistedQueue(storedState) {
  return Array.isArray(storedState?.usernames) && storedState.usernames.length > 0;
}

function shouldAutoRecoverRun(storedState, runner) {
  if (!storedState || !hasPersistedQueue(storedState)) return false;
  if (storedState.status !== "running") return false;
  if (isRuntimeBusyState(runner?.contentState)) return false;
  return true;
}

function getTimestampMs(value) {
  if (!value) return null;
  const timestamp = typeof value === "number" ? value : Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

async function wakeRunnerTab(tabId, reason = "manual") {
  if (!tabId) return { ok: false, reason: "no_instagram_tab" };
  try {
    const response = await chrome.tabs.sendMessage(tabId, { action: "wake", reason });
    return { ...(response || {}), ok: response?.ok !== false, tabId };
  } catch (error) {
    return { ok: false, reason: "send_failed", detail: error?.message || String(error), tabId };
  }
}

async function resumeStoredRun(storedState, reason = "manual") {
  if (!hasPersistedQueue(storedState)) {
    return { ok: false, reason: "no_saved_queue" };
  }

  const tabId = await ensureRunnerTab({ createIfMissing: true });
  if (!tabId) return { ok: false, reason: "no_instagram_tab" };
  await setRunnerTabId(tabId);

  try {
    const loginCheck = await sendTabMessageWithRetry(tabId, { action: "login_check" }, 8, 8000);
    if (!loginCheck?.loggedIn) return { ok: false, reason: "not_logged_in", tabId };

    const startResponse = await sendTabMessageWithRetry(tabId, {
      action: "start",
      usernames: storedState.usernames,
      config: storedState.config || {},
      resumeReason: reason,
    }, 8, 8000);

    return {
      ...(startResponse || {}),
      ok: startResponse?.ok !== false,
      reason,
      tabId,
    };
  } catch (error) {
    return {
      ok: false,
      reason: "resume_failed",
      detail: error?.message || String(error),
      tabId,
    };
  }
}

async function maybeWakeStalledRunner(storedState, runner) {
  if (!runner?.tabId || runner.contentState !== "running" || storedState?.status !== "running") return null;
  if (storedState.phase !== "batch_pause") return null;

  const updatedAt = getTimestampMs(storedState.updatedAt);
  if (!updatedAt || Date.now() - updatedAt < STALE_BATCH_WAKE_MS) return null;

  return wakeRunnerTab(runner.tabId, "stale_batch_pause");
}

function isWebsiteSender(sender) {
  const url = sender?.url || sender?.tab?.url || "";
  return /^https:\/\/([a-z0-9-]+\.)?instaclean\.nl\//i.test(url)
    || /^http:\/\/localhost:3000\//i.test(url)
    || /^http:\/\/127\.0\.0\.1:3000\//i.test(url);
}

function cleanUsername(username) {
  return String(username || "").trim().replace(/^@+/, "").replace(/\/+$/, "");
}

function buildProfileUrl(username) {
  return `https://www.instagram.com/${encodeURIComponent(username)}/?${LIVE_FALLBACK_PARAM}=1`;
}

function buildProfileReadyPrefix(username) {
  return `https://www.instagram.com/${encodeURIComponent(username)}/`;
}

function isMarkedLiveFallbackTab(tab) {
  if (!tab?.url?.includes("instagram.com")) return false;
  try {
    const parsed = new URL(tab.url);
    return parsed.hostname === "www.instagram.com" && parsed.searchParams.has(LIVE_FALLBACK_PARAM);
  } catch {
    return false;
  }
}

async function findMarkedLiveFallbackTab() {
  await loadTabRoles();
  try {
    const tabs = await chrome.tabs.query({ url: "https://www.instagram.com/*" });
    const marked = tabs.find((tab) => tab.id !== runnerTabId && isMarkedLiveFallbackTab(tab));
    return marked?.id || null;
  } catch {
    return null;
  }
}

async function withLiveFallbackLock(task) {
  while (liveFallbackTabLock) {
    try { await liveFallbackTabLock; } catch {}
  }

  const run = task();
  liveFallbackTabLock = run;
  try {
    return await run;
  } finally {
    if (liveFallbackTabLock === run) liveFallbackTabLock = null;
  }
}

async function waitForTabComplete(tabId, timeoutMs = 25000, expectedUrlPrefix = "") {
  const isReady = (tab) => tab?.status === "complete" && (!expectedUrlPrefix || String(tab.url || "").startsWith(expectedUrlPrefix));

  try {
    const tab = await chrome.tabs.get(tabId);
    if (isReady(tab)) return true;
  } catch {
    return false;
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      resolve(false);
    }, timeoutMs);

    const listener = async (updatedTabId, changeInfo) => {
      if (updatedTabId !== tabId || changeInfo.status !== "complete") return;
      try {
        const tab = await chrome.tabs.get(tabId);
        if (!isReady(tab)) return;
      } catch {
        clearTimeout(timeout);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve(false);
        return;
      }
      clearTimeout(timeout);
      chrome.tabs.onUpdated.removeListener(listener);
      resolve(true);
    };

    chrome.tabs.onUpdated.addListener(listener);
  });
}

function withTimeout(promise, timeoutMs, timeoutMessage) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    Promise.resolve(promise)
      .then((value) => {
        clearTimeout(timeout);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}

async function sendTabMessageWithRetry(tabId, message, tries = 24, responseTimeoutMs = UI_FALLBACK_RESPONSE_TIMEOUT_MS) {
  let lastError = "";
  for (let attempt = 0; attempt < tries; attempt++) {
    try {
      return await withTimeout(
        chrome.tabs.sendMessage(tabId, message),
        responseTimeoutMs,
        `timeout na ${Math.round(responseTimeoutMs / 1000)}s`
      );
    } catch (error) {
      lastError = error?.message || String(error);
      await delay(500);
    }
  }

  throw new Error(lastError || "content script niet klaar");
}

async function getOrCreateLiveFallbackTab(url) {
  return withLiveFallbackLock(async () => {
    await loadTabRoles();
    if (liveFallbackTabId && liveFallbackTabId === runnerTabId) {
      await setLiveFallbackTabId(null);
    }

    const candidateIds = [liveFallbackTabId, await findMarkedLiveFallbackTab()]
      .filter((id, index, arr) => id && id !== runnerTabId && arr.indexOf(id) === index);

    for (const id of candidateIds) {
      try {
        const existing = await chrome.tabs.get(id);
        if (existing.id === runnerTabId) {
          await setLiveFallbackTabId(null);
          continue;
        }
        const updated = await chrome.tabs.update(existing.id, { url, active: true });
        await setLiveFallbackTabId(existing.id);
        if (updated.windowId || existing.windowId) {
          try { await chrome.windows.update(updated.windowId || existing.windowId, { focused: true }); } catch {}
        }
        return { id: existing.id };
      } catch {
        if (id === liveFallbackTabId) await setLiveFallbackTabId(null);
      }
    }

    const tab = await chrome.tabs.create({ url, active: true });
    await setLiveFallbackTabId(tab.id);
    if (tab.windowId) {
      try { await chrome.windows.update(tab.windowId, { focused: true }); } catch {}
    }
    return tab;
  });
}

async function runUiFallbackCancel(username, mode = "cancel") {
  const safeUsername = cleanUsername(username);
  if (!safeUsername) {
    return {
      ok: false,
      reason: "ui_fallback_failed",
      stage: "ui_fallback",
      detail: "ui_fallback: lege username",
      retryable: false,
      fatal: false,
    };
  }

  let tab = null;
  try {
    const url = buildProfileUrl(safeUsername);
    const readyPrefix = buildProfileReadyPrefix(safeUsername);
    tab = await getOrCreateLiveFallbackTab(url);

    await delay(250);
    const loaded = await waitForTabComplete(tab.id, 25000, readyPrefix);
    if (!loaded) {
      return {
        ok: false,
        reason: "ui_fallback_failed",
        stage: "ui_fallback",
        detail: `ui_fallback: profielpagina voor @${safeUsername} laadde niet op tijd`,
        retryable: false,
        fatal: false,
      };
    }

    await delay(1200);
    return await sendTabMessageWithRetry(tab.id, {
      action: "ui_cancel_profile",
      username: safeUsername,
      mode,
    }, 1, UI_FALLBACK_RESPONSE_TIMEOUT_MS);
  } catch (error) {
    return {
      ok: false,
      reason: "ui_fallback_failed",
      stage: "ui_fallback",
      detail: `ui_fallback: ${error?.message || String(error)}`.slice(0, 240),
      retryable: false,
      fatal: false,
    };
  }
}

function handleWebsiteCommand(msg, sender, sendResponse) {
  if (msg.action === "ping") {
    sendResponse({ installed: true, version: chrome.runtime.getManifest().version });
    return true;
  }

  if (msg.action === "start_from_website" || msg.action === "start_from_popup") {
    (async () => {
      await loadTabRoles();
      if (sender.tab?.id) await setWebsiteTabId(sender.tab.id);

      if (!Array.isArray(msg.usernames) || msg.usernames.length === 0) {
        sendResponse({ ok: false, reason: "no_usernames", message: "Geen usernames gevonden om te verwerken." });
        return;
      }

      const existingRun = await findRunningInstagramTab();
      if (existingRun.contentState === "running" || existingRun.contentState === "paused" || existingRun.contentState === "stopping") {
        sendResponse({
          ok: false,
          reason: "already_running",
          message: existingRun.contentState === "paused"
            ? "Er staat al een InstaClean taak gepauzeerd. Hervat of stop die eerst."
            : "Er draait al een InstaClean taak. Stop die eerst voordat je opnieuw start.",
          tabId: existingRun.tabId,
        });
        return;
      }

      const igTabId = await ensureRunnerTab({ createIfMissing: true });
      if (!igTabId) {
        sendResponse({ ok: false, reason: "no_instagram_tab", message: "Open instagram.com in een andere tab en log in." });
        return;
      }
      await setRunnerTabId(igTabId);

      try {
        const loginCheck = await sendTabMessageWithRetry(igTabId, { action: "login_check" }, 12);
        if (!loginCheck?.loggedIn) {
          sendResponse({ ok: false, reason: "not_logged_in", message: "Log eerst in op Instagram." });
          return;
        }
      } catch {
        sendResponse({ ok: false, reason: "content_script_error", message: "Refresh de Instagram pagina en probeer opnieuw." });
        return;
      }

      try {
        const startResponse = await sendTabMessageWithRetry(igTabId, {
          action: "start",
          usernames: msg.usernames,
          config: msg.config,
        }, 12);
        if (startResponse?.ok === false) {
          sendResponse({
            ok: false,
            reason: startResponse.reason || "start_failed",
            message: startResponse.reason === "already_running"
              ? "Er draait al een InstaClean taak."
              : "Kon de taak niet starten.",
          });
          return;
        }
        sendResponse({ ok: true, tabId: igTabId });
      } catch {
        sendResponse({ ok: false, reason: "send_failed", message: "Kon niet verbinden met Instagram tab." });
      }
    })();
    return true;
  }

  if (msg.action === "get_state") {
    (async () => {
      sendResponse(await getRuntimeState());
    })();
    return true;
  }

  if (msg.action === "wake_runner") {
    (async () => {
      const runner = await findRunningInstagramTab();
      if (!runner.tabId) {
        sendResponse({ ok: false, reason: "no_instagram_tab" });
        return;
      }
      await setRunnerTabId(runner.tabId);
      sendResponse(await wakeRunnerTab(runner.tabId, msg.reason || "manual"));
    })();
    return true;
  }

  if (msg.action === "resume_stored_job") {
    (async () => {
      const stored = await chrome.storage.local.get("ic_state");
      sendResponse(await resumeStoredRun(stored.ic_state, msg.reason || "manual_resume"));
    })();
    return true;
  }

  if (msg.action === "pause" || msg.action === "resume" || msg.action === "stop") {
    (async () => {
      const runner = await findRunningInstagramTab();
      if (!runner.tabId) {
        sendResponse({ ok: false, reason: "no_instagram_tab" });
        return;
      }
      await setRunnerTabId(runner.tabId);

      try {
        const response = await chrome.tabs.sendMessage(runnerTabId, { action: msg.action });
        sendResponse({ ...(response || {}), ok: response?.ok !== false, tabId: runnerTabId });
      } catch {
        sendResponse({ ok: false, reason: "send_failed" });
      }
    })();
    return true;
  }

  if (msg.action === "clear_progress") {
    chrome.storage.local.remove("ic_state");
    chrome.action.setBadgeText({ text: "" });
    const runnerId = runnerTabId || activeTabId;
    if (runnerId && runnerId !== liveFallbackTabId) {
      try { chrome.tabs.sendMessage(runnerId, { action: "clear_progress" }); } catch {}
    }
    sendResponse({ ok: true });
    return true;
  }

  sendResponse({ ok: false, reason: "unknown_action" });
  return true;
}

// ── External messages from instaclean.nl website ──
chrome.runtime.onMessageExternal.addListener((msg, sender, sendResponse) => {
  if (!isWebsiteSender(sender)) {
    sendResponse({ ok: false, reason: "untrusted_sender" });
    return true;
  }

  return handleWebsiteCommand(msg, sender, sendResponse);
});

// ── Internal messages from content script + popup ──
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (isWebsiteSender(sender) && ["ping", "start_from_website", "get_state", "wake_runner", "resume_stored_job", "pause", "resume", "stop", "clear_progress"].includes(msg.action)) {
    return handleWebsiteCommand(msg, sender, sendResponse);
  }

  if (["start_from_popup", "get_state", "wake_runner", "resume_stored_job", "pause", "resume", "stop", "clear_progress"].includes(msg.action)) {
    return handleWebsiteCommand(msg, sender, sendResponse);
  }

  if (sender?.tab?.id && sender.tab.url?.includes("instagram.com") && ["started", "progress", "rate_limit", "rate_limit_pause", "done", "already_done", "error", "batch_pause", "ui_fallback_live"].includes(msg.action)) {
    const senderTab = { id: sender.tab.id, url: sender.tab.url };
    loadTabRoles().then(() => {
      if (senderTab.id !== liveFallbackTabId && isSafeRunnerTab(senderTab)) {
        setRunnerTabId(senderTab.id);
      }
    });
  }

  if (msg.action === "ui_fallback_cancel") {
    runUiFallbackCancel(msg.username, msg.mode).then(sendResponse);
    return true;
  }

  // Badge updates
  if (msg.action === "progress") {
    const pct = msg.total > 0 ? Math.round((msg.current / msg.total) * 100) : 0;
    chrome.action.setBadgeText({ text: `${pct}%` });
    chrome.action.setBadgeBackgroundColor({ color: "#8B5CF6" });

    // Forward to website tab if connected
    forwardToWebsite(msg);
  }

  if (msg.action === "done") {
    chrome.action.setBadgeText({ text: "✓" });
    chrome.action.setBadgeBackgroundColor({ color: "#10B981" });
    setTimeout(() => chrome.action.setBadgeText({ text: "" }), 30000);

    forwardToWebsite(msg);
  }

  if (msg.action === "already_done") {
    chrome.action.setBadgeText({ text: "—" });
    chrome.action.setBadgeBackgroundColor({ color: "#06B6D4" });
    setTimeout(() => chrome.action.setBadgeText({ text: "" }), 10000);

    forwardToWebsite(msg);
  }

  if (msg.action === "rate_limit" || msg.action === "rate_limit_pause") {
    chrome.action.setBadgeText({ text: "!!" });
    chrome.action.setBadgeBackgroundColor({ color: "#F59E0B" });

    forwardToWebsite(msg);
  }

  if (msg.action === "ui_fallback_live") {
    chrome.action.setBadgeText({ text: "LIVE" });
    chrome.action.setBadgeBackgroundColor({ color: "#10B981" });

    forwardToWebsite(msg);
  }

  if (msg.action === "error") {
    chrome.action.setBadgeText({ text: "!" });
    chrome.action.setBadgeBackgroundColor({ color: "#EF4444" });

    forwardToWebsite(msg);
  }

  if (msg.action === "started" || msg.action === "batch_pause") {
    if (msg.action === "started") {
      chrome.action.setBadgeText({ text: "0%" });
      chrome.action.setBadgeBackgroundColor({ color: "#8B5CF6" });
    }
    forwardToWebsite(msg);
  }
});

// Track tab closures
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === activeTabId) activeTabId = null;
  if (tabId === runnerTabId) runnerTabId = null;
  if (tabId === websiteTabId) websiteTabId = null;
  if (tabId === liveFallbackTabId) liveFallbackTabId = null;
  saveTabRoles();
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({ text: "" });
});
