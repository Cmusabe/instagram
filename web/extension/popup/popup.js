// InstaClean Extension Popup

const PRESETS = {
  safe: { delay: 9000, batchSize: 10, batchPause: 120000 },
  balanced: { delay: 6000, batchSize: 15, batchPause: 90000 },
  fast: { delay: 4000, batchSize: 25, batchPause: 60000 },
};

let usernames = [];
let selectedPreset = "balanced";
let activeTabId = null;
let results = [];
let progressPoller = null;
let wakeInFlight = false;
let lastRuntimeInterrupted = false;
let lastRuntimeCanResumeStored = false;

const STALE_BATCH_WAKE_MS = 150000;
const RECOVERABLE_STATES = new Set(["running", "paused", "stopping"]);

function showView(id) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  const el = document.getElementById(`view-${id}`);
  if (el) el.classList.add("active");
  if (id === "progress") startProgressPolling();
  else stopProgressPolling();
}

function isRunningState(value) {
  return value === "running" || value === "paused" || value === "stopping";
}

function hasActiveRuntime(runtime) {
  return isRunningState(runtime?.state?.status) && isRunningState(runtime?.contentState);
}

function hasStoredRun(runtime) {
  const storedState = runtime?.state;
  if (!storedState || !RECOVERABLE_STATES.has(storedState.status)) return false;
  return hasActiveRuntime(runtime)
    || (Array.isArray(storedState.usernames) && storedState.usernames.length > 0)
    || Number(storedState.current || storedState.stats?.current || 0) > 0;
}

function formatRelativeTime(value) {
  if (!value) return "nog geen update";
  const ts = typeof value === "number" ? value : Date.parse(value);
  if (!Number.isFinite(ts)) return "onbekend";
  const seconds = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (seconds < 10) return "net";
  if (seconds < 60) return `${seconds}s geleden`;
  const minutes = Math.round(seconds / 60);
  return `${minutes}m geleden`;
}

function getTimestampMs(value) {
  if (!value) return null;
  const timestamp = typeof value === "number" ? value : Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function setLiveStatus({ phase, current, updatedAt } = {}) {
  if (phase) setText("progress-phase", phase);
  if (current) setText("progress-current", current);
  if (updatedAt !== undefined) setText("progress-updated", formatRelativeTime(updatedAt));
}

function getPhaseLabel(phase, fallback = "Worker actief") {
  switch (phase) {
    case "profile_check": return "Profiel check";
    case "api_cancel": return "API annuleren";
    case "live_fallback": return "LIVE profielcheck";
    case "batch_pause": return "Batch pauze";
    case "completed": return "Klaar";
    case "stopped": return "Gestopt";
    default: return fallback;
  }
}

function addLogEntry({ username = "", status = "", detail = "", text = "", ts = Date.now() } = {}, { prepend = true } = {}) {
  const log = document.getElementById("log");
  if (!log) return;

  const entry = document.createElement("div");
  entry.className = `log-entry ${status}`;
  entry.dataset.ts = String(ts);

  if (text) {
    entry.textContent = text;
  } else {
    const icon = status === "success" ? "✓" : status === "skipped" ? "⏭" : status === "failed" ? "✗" : "•";
    const suffix = detail ? ` — ${detail}` : "";
    entry.textContent = `${icon} @${username}${suffix}`;
  }

  if (prepend) log.prepend(entry);
  else log.appendChild(entry);
  while (log.children.length > 50) log.removeChild(log.lastChild);
}

function renderStoredLog(entries = []) {
  const log = document.getElementById("log");
  if (!log) return;
  log.innerHTML = "";
  entries.slice(0, 30).reverse().forEach((entry) => addLogEntry(entry, { prepend: true }));
}

async function getRuntimeState() {
  try {
    return await chrome.runtime.sendMessage({ action: "get_state" });
  } catch {
    return null;
  }
}

function startProgressPolling() {
  if (progressPoller) return;
  progressPoller = setInterval(refreshRuntimeProgress, 5000);
}

function stopProgressPolling() {
  if (!progressPoller) return;
  clearInterval(progressPoller);
  progressPoller = null;
}

async function refreshRuntimeProgress() {
  const runtime = await getRuntimeState();
  if (hasStoredRun(runtime)) {
    reconnectProgress(runtime);
    return;
  }
  stopProgressPolling();
}

async function wakeRunner(reason) {
  if (wakeInFlight) return;
  wakeInFlight = true;
  try {
    await chrome.runtime.sendMessage({ action: "wake_runner", reason });
  } catch {
    // The next poll tries again if the runner is still stale.
  } finally {
    setTimeout(() => { wakeInFlight = false; }, 10000);
  }
}

async function resumeStoredJob(reason) {
  if (wakeInFlight) return { ok: false, reason: "already_recovering" };
  wakeInFlight = true;
  try {
    return await chrome.runtime.sendMessage({ action: "resume_stored_job", reason });
  } catch {
    return { ok: false, reason: "runtime_error" };
  } finally {
    setTimeout(() => { wakeInFlight = false; }, 10000);
  }
}

function maybeWakeStalledRuntime(runtime) {
  const storedState = runtime?.state;
  if (runtime?.contentState !== "running" || storedState?.status !== "running") return;
  if (storedState.phase !== "batch_pause") return;

  const updatedAt = getTimestampMs(storedState.updatedAt);
  if (!updatedAt || Date.now() - updatedAt < STALE_BATCH_WAKE_MS) return;

  setLiveStatus({
    phase: "Batch pauze herstellen",
    current: "Worker wakker maken",
    updatedAt: Date.now(),
  });
  wakeRunner("stale_batch_pause_popup");
}

function reconnectProgress(runtime) {
  activeTabId = runtime?.tabId || activeTabId;
  const stats = runtime?.state?.stats || {};
  const completed = runtime?.state?.completed || [];
  const total = runtime?.state?.total || stats.total || 0;
  const current = runtime?.state?.current || stats.current || completed.length;
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  const isPaused = runtime?.contentState === "paused" || runtime?.state?.status === "paused";
  const isStopping = runtime?.state?.status === "stopping";
  const isInterrupted = RECOVERABLE_STATES.has(runtime?.state?.status) && !isRunningState(runtime?.contentState);
  const canResumeStored = isInterrupted && Array.isArray(runtime?.state?.usernames) && runtime.state.usernames.length > 0;
  const canAutoResumeStored = canResumeStored && runtime?.state?.status === "running";
  const currentUsername = runtime?.state?.currentUsername;
  const phase = getPhaseLabel(runtime?.state?.phase, isStopping ? "Stoppen" : isPaused ? "Gepauzeerd" : "Worker actief");
  lastRuntimeInterrupted = isInterrupted;
  lastRuntimeCanResumeStored = canResumeStored;

  setText("progress-label", isInterrupted
    ? (canAutoResumeStored ? "Onderbroken — automatisch herstellen..." : canResumeStored ? "Onderbroken — klik Hervat" : "Onderbroken — oude taak kan niet herstellen")
    : isStopping ? "Stoppen..." : isPaused ? "Gepauzeerd (echte worker)" : "Bezig (echte worker)...");
  setText("progress-count", total > 0 ? `${current} / ${total}` : `${completed.length} verwerkt`);
  setText("progress-pct", total > 0 ? `${pct}%` : "");
  setText("progress-eta", "");
  setText("stat-cancelled", stats.cancelled || 0);
  setText("stat-skipped", stats.skipped || 0);
  setText("stat-failed", stats.failed || 0);
  const bar = document.getElementById("progress-bar");
  if (bar) bar.style.width = total > 0 ? `${pct}%` : "0%";

  const statusDot = document.getElementById("progress-status");
  if (statusDot) statusDot.className = isPaused || isInterrupted ? "status-dot paused" : "status-dot running";
  const pauseBtn = document.getElementById("btn-pause");
  const resumeBtn = document.getElementById("btn-resume");
  const resetBtn = document.getElementById("btn-reset-progress");
  if (pauseBtn) pauseBtn.hidden = isPaused || isStopping || isInterrupted;
  if (resumeBtn) resumeBtn.hidden = (!isPaused && !canResumeStored) || isStopping;
  if (resetBtn) resetBtn.hidden = !isInterrupted;
  setLiveStatus({
    phase: isInterrupted ? (canResumeStored ? "Herstellen" : "Herstart nodig") : phase,
    current: isInterrupted
      ? (canResumeStored ? "Queue opnieuw verbinden" : "Upload opnieuw of reset")
      : currentUsername ? `@${currentUsername}` : "Wacht op volgende account",
    updatedAt: runtime?.state?.updatedAt,
  });
  renderStoredLog(runtime?.state?.log || []);
  maybeWakeStalledRuntime(runtime);
  if (canAutoResumeStored) resumeStoredJob("popup_auto_recover");
  showView("progress");
}

async function sendControlAction(action) {
  try {
    // Always let the background route controls to the real runner tab.
    // The visible LIVE/profile tab also has a content script, but it must never receive Pause/Stop.
    const response = await chrome.runtime.sendMessage({ action });
    if (response?.tabId) activeTabId = response.tabId;
    return response || { ok: false, reason: "no_response" };
  } catch {
    return { ok: false, reason: "runtime_error" };
  }
}

// ── Init ──

document.addEventListener("DOMContentLoaded", async () => {
  setText("app-version", `v${chrome.runtime.getManifest().version}`);
  showView("loading");
  setupEventListeners();

  const runtime = await getRuntimeState();
  if (hasStoredRun(runtime)) {
    reconnectProgress(runtime);
    return;
  }
  if (runtime?.state?.status === "error") {
    alert(runtime.state.error || "De vorige InstaClean taak stopte door een interne fout.");
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url?.includes("instagram.com")) {
    showView("not-instagram");
    return;
  }
  activeTabId = tab.id;

  try {
    const res = await chrome.tabs.sendMessage(activeTabId, { action: "login_check" });
    if (!res?.loggedIn) { showView("not-logged-in"); return; }
  } catch {
    showView("not-instagram");
    return;
  }

  showView("upload");
});

function setupEventListeners() {
  // Tabs
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(tc => tc.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(`tab-${tab.dataset.tab}`)?.classList.add("active");
    });
  });

  // File upload
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");
  if (dropzone && fileInput) {
    dropzone.addEventListener("click", () => fileInput.click());
    dropzone.addEventListener("dragover", e => { e.preventDefault(); dropzone.classList.add("drag-over"); });
    dropzone.addEventListener("dragleave", () => dropzone.classList.remove("drag-over"));
    dropzone.addEventListener("drop", e => { e.preventDefault(); dropzone.classList.remove("drag-over"); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); });
    fileInput.addEventListener("change", e => { if (e.target.files[0]) handleFile(e.target.files[0]); });
  }

  // Paste
  const pasteInput = document.getElementById("paste-input");
  const processBtn = document.getElementById("btn-process-paste");
  if (pasteInput && processBtn) {
    pasteInput.addEventListener("input", () => { processBtn.disabled = !pasteInput.value.trim(); });
    processBtn.addEventListener("click", () => loadUsernames(Parser.parseText(pasteInput.value)));
  }

  // Open Instagram
  document.getElementById("btn-open-ig")?.addEventListener("click", () => chrome.tabs.create({ url: "https://www.instagram.com" }));

  // Presets
  document.querySelectorAll(".preset").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".preset").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedPreset = btn.dataset.preset;
      updateEstimate();
    });
  });

  // Start
  document.getElementById("btn-start")?.addEventListener("click", startProcess);
  document.getElementById("btn-back")?.addEventListener("click", () => { usernames = []; showView("upload"); });

  // Pause / Resume / Stop
  document.getElementById("btn-pause")?.addEventListener("click", async () => {
    const response = await sendControlAction("pause");
    if (!response.ok) { alert("Pauzeren lukte niet. De taak draait mogelijk niet meer."); return; }
    document.getElementById("btn-pause").hidden = true;
    document.getElementById("btn-resume").hidden = false;
    document.getElementById("progress-status").className = "status-dot paused";
    document.getElementById("progress-label").textContent = "Gepauzeerd";
    setLiveStatus({ phase: "Gepauzeerd", current: "Wacht op Hervat", updatedAt: Date.now() });
  });

  document.getElementById("btn-resume")?.addEventListener("click", async () => {
    const response = lastRuntimeInterrupted && lastRuntimeCanResumeStored
      ? await resumeStoredJob("popup_resume")
      : await sendControlAction("resume");
    if (!response.ok) { alert("Hervatten lukte niet. De taak is mogelijk al gestopt."); return; }
    document.getElementById("btn-resume").hidden = true;
    document.getElementById("btn-pause").hidden = false;
    document.getElementById("progress-status").className = "status-dot running";
    document.getElementById("progress-label").textContent = "Bezig met annuleren...";
    setLiveStatus({ phase: "Worker actief", current: "Gaat verder", updatedAt: Date.now() });
  });

  document.getElementById("btn-stop")?.addEventListener("click", async () => {
    const response = await sendControlAction("stop");
    if (!response.ok) { alert("Stoppen lukte niet. De taak draait mogelijk niet meer."); return; }
    setText("progress-label", "Stoppen...");
    setLiveStatus({ phase: "Stoppen", current: "Rondt huidige stap af", updatedAt: Date.now() });
  });

  document.getElementById("btn-reset-progress")?.addEventListener("click", async () => {
    await chrome.runtime.sendMessage({ action: "clear_progress" });
    usernames = [];
    results = [];
    lastRuntimeInterrupted = false;
    lastRuntimeCanResumeStored = false;
    showView("upload");
  });

  // Done
  document.getElementById("btn-export")?.addEventListener("click", exportCSV);
  document.getElementById("btn-restart")?.addEventListener("click", () => {
    // Clear stored progress
    chrome.runtime.sendMessage({ action: "clear_progress" });
    usernames = [];
    results = [];
    showView("upload");
  });
}

// ── File ──

function handleFile(file) {
  const reader = new FileReader();
  reader.onload = e => {
    const parsed = Parser.parseFile(e.target.result, file.name);
    const dropzone = document.getElementById("dropzone");
    if (parsed.length > 0 && dropzone) {
      dropzone.classList.add("success");
      dropzone.innerHTML = `<div class="dropzone-icon">✓</div><p>${file.name}</p><span class="muted small">${parsed.length} usernames</span>`;
    }
    loadUsernames(parsed);
  };
  reader.readAsText(file);
}

function loadUsernames(parsed) {
  const result = Parser.validateAll(parsed);
  usernames = result.valid;
  if (usernames.length === 0) { alert("Geen geldige usernames gevonden."); return; }

  document.getElementById("count-number").textContent = usernames.length > 999 ? `${(usernames.length / 1000).toFixed(1)}k` : usernames.length;
  document.getElementById("count-label").textContent = `${usernames.length} usernames geladen`;
  updateEstimate();
  showView("config");
}

function updateEstimate() {
  const p = PRESETS[selectedPreset];
  const totalSec = (usernames.length * (p.delay + 800) / 1000) + (Math.floor(usernames.length / p.batchSize) * p.batchPause / 1000);
  const mins = Math.max(1, Math.round(totalSec / 60 * 1.1));
  const el = document.getElementById("time-estimate");
  if (el) el.textContent = mins < 60 ? `Geschatte tijd: ~${mins} minuten` : `Geschatte tijd: ~${Math.floor(mins / 60)}u ${mins % 60}min`;
}

// ── Start ──

async function startProcess() {
  const p = PRESETS[selectedPreset];
  const config = { delay: p.delay, batchSize: p.batchSize, batchPause: p.batchPause };

  try {
    const response = await chrome.runtime.sendMessage({ action: "start_from_popup", usernames, config });
    if (!response?.ok) {
      alert(response?.message || "Kan niet starten. Open Instagram en probeer opnieuw.");
      return;
    }
    if (response.tabId) activeTabId = response.tabId;
  } catch {
    alert("Kan niet verbinden met Instagram. Refresh de pagina en probeer opnieuw.");
    return;
  }

  results = [];
  const log = document.getElementById("log");
  if (log) log.innerHTML = "";
  const rlb = document.getElementById("rate-limit-banner");
  if (rlb) rlb.hidden = true;
  showView("progress");
}

// ── Messages from content script ──

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "progress") {
    const pct = msg.total > 0 ? Math.round((msg.current / msg.total) * 100) : 0;

    const bar = document.getElementById("progress-bar");
    if (bar) bar.style.width = `${pct}%`;

    setText("progress-count", `${msg.current} / ${msg.total}`);
    setText("progress-pct", `${pct}%`);
    setText("progress-eta", msg.eta || "");
    setText("stat-cancelled", msg.cancelled);
    setText("stat-skipped", msg.skipped);
    setText("stat-failed", msg.failed);
    setText("progress-label", `Bezig... ${msg.speed || 0}/min`);
    setLiveStatus({
      phase: msg.status === "success" ? "Geannuleerd" : msg.status === "skipped" ? "Overgeslagen" : "Controle nodig",
      current: msg.username ? `@${msg.username}` : "Volgende account",
      updatedAt: Date.now(),
    });

    const rlb = document.getElementById("rate-limit-banner");
    if (rlb) rlb.hidden = true;

    const statusDot = document.getElementById("progress-status");
    if (statusDot) statusDot.className = "status-dot running";
    const pauseBtn = document.getElementById("btn-pause");
    const resumeBtn = document.getElementById("btn-resume");
    if (pauseBtn) pauseBtn.hidden = false;
    if (resumeBtn) resumeBtn.hidden = true;

    // Log
    results.push({ username: msg.username, status: msg.status, reason: msg.reason || "", detail: msg.reasonDetail || "" });
    const suffix = msg.reasonDetail
      ? ` — ${msg.reasonDetail}`
      : msg.reasonLabel
        ? ` — ${msg.reasonLabel}`
        : "";
    addLogEntry({
      username: msg.username,
      status: msg.status,
      detail: suffix.replace(/^ — /, ""),
    });
  }

  if (msg.action === "rate_limit") {
    const tryingUiFallback = String(msg.message || "").includes("zichtbare Instagram-knop");
    const rlb = document.getElementById("rate-limit-banner");
    if (rlb) { rlb.hidden = false; setText("rate-limit-msg", msg.message); }
    const statusDot = document.getElementById("progress-status");
    if (statusDot) statusDot.className = tryingUiFallback ? "status-dot running" : "status-dot paused";
    setText("progress-label", tryingUiFallback ? "API cooldown — UI fallback..." : "Rate limited — wachten...");
    setText("progress-eta", "");
    setLiveStatus({
      phase: tryingUiFallback ? "LIVE fallback" : "Cooldown",
      current: tryingUiFallback ? "Zichtbare Instagram-knop" : "Instagram laat ons wachten",
      updatedAt: Date.now(),
    });
  }

  if (msg.action === "rate_limit_pause") {
    const rlb = document.getElementById("rate-limit-banner");
    if (rlb) { rlb.hidden = false; setText("rate-limit-msg", msg.message); }
    const statusDot = document.getElementById("progress-status");
    if (statusDot) statusDot.className = "status-dot paused";
    setText("progress-label", "Instagram pauzeerde tijdelijk");
    setText("progress-eta", "");
    setLiveStatus({
      phase: "Gepauzeerd door Instagram",
      current: "Klik Hervat pas na controle",
      updatedAt: Date.now(),
    });
    const pauseBtn = document.getElementById("btn-pause");
    const resumeBtn = document.getElementById("btn-resume");
    if (pauseBtn) pauseBtn.hidden = true;
    if (resumeBtn) resumeBtn.hidden = false;
  }

  if (msg.action === "ui_fallback_live") {
    setText("progress-label", `Live check: @${msg.username}`);
    setLiveStatus({
      phase: "LIVE profielcheck",
      current: `@${msg.username}`,
      updatedAt: Date.now(),
    });
    const statusDot = document.getElementById("progress-status");
    if (statusDot) statusDot.className = "status-dot running";
    addLogEntry({ status: "live", text: `LIVE @${msg.username} — profiel geopend` });
  }

  if (msg.action === "batch_pause") {
    setText("progress-label", `Batch pauze (${Math.round(msg.pauseMs / 1000)}s)...`);
    setLiveStatus({
      phase: "Batch pauze",
      current: `${msg.processed || 0} verwerkt, daarna verder`,
      updatedAt: Date.now(),
    });
  }

  if (msg.action === "started") {
    setText("progress-label", `Bezig met annuleren (${msg.total})...`);
    setText("progress-count", `0 / ${msg.total}`);
    setText("progress-pct", "0%");
    setText("stat-cancelled", "0");
    setText("stat-skipped", "0");
    setText("stat-failed", "0");
    const bar = document.getElementById("progress-bar");
    if (bar) bar.style.width = "0%";
    const pauseBtn = document.getElementById("btn-pause");
    const resumeBtn = document.getElementById("btn-resume");
    if (pauseBtn) pauseBtn.hidden = false;
    if (resumeBtn) resumeBtn.hidden = true;
    setLiveStatus({
      phase: "Worker gestart",
      current: "Wacht op eerste account",
      updatedAt: Date.now(),
    });
    showView("progress");
  }

  if (msg.action === "done") {
    const mins = Math.max(1, Math.round(msg.durationMs / 60000));
    setText("done-summary", msg.stopped
      ? `Gestopt na ${msg.cancelled + msg.skipped + msg.failed} / ${msg.total} verwerkt (${msg.cancelled} geannuleerd).`
      : `${msg.cancelled} geannuleerd in ${mins} min`);
    setText("done-cancelled", msg.cancelled);
    setText("done-skipped", msg.skipped);
    setText("done-failed", msg.failed);
    showView("done");
  }

  if (msg.action === "already_done") {
    setText("done-summary", `Alle ${msg.total} usernames waren al verwerkt. Klik "Opnieuw beginnen" om progress te wissen.`);
    setText("done-cancelled", "0");
    setText("done-skipped", String(msg.previouslyCompleted));
    setText("done-failed", "0");
    showView("done");
  }

  if (msg.action === "error") {
    alert(msg.message);
    showView("upload");
  }
});

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = String(text);
}

// ── Export ──

function exportCSV() {
  if (results.length === 0) return;
  const escapeCsv = (value) => `"${String(value || "").replaceAll("\"", "\"\"")}"`;
  const csv = "username,status,reason,detail\n" + results
    .map(r => [r.username, r.status, r.reason || "", r.detail || ""].map(escapeCsv).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `instaclean-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
