"use client";

import { useEffect, useState, useCallback } from "react";
import { Globe, ArrowRight, CheckCircle, AlertTriangle, Loader2, Pause, Square, Zap, Clock } from "lucide-react";

const MIN_EXTENSION_VERSION = "1.1.27";

interface ExtensionState {
  installed: boolean;
  version?: string;
  supported: boolean;
}

interface ProgressData {
  action: string;
  current?: number;
  total?: number;
  cancelled?: number;
  skipped?: number;
  failed?: number;
  eta?: string;
  speed?: number;
  username?: string;
  status?: string;
  message?: string;
  reasonLabel?: string;
  reasonDetail?: string;
  durationMs?: number;
  previouslyCompleted?: number;
  stopped?: boolean;
  phase?: string;
  updatedAt?: string;
}

interface RuntimeResponse {
  state?: {
    status?: string;
    current?: number;
    total?: number;
    currentUsername?: string;
    phase?: string;
    updatedAt?: string;
    stats?: { cancelled?: number; skipped?: number; failed?: number };
    log?: { username?: string; status?: string; detail?: string; text?: string }[];
  };
  contentState?: string;
}

function parseVersion(version = "0.0.0") {
  return version.split(".").map((part) => Number.parseInt(part, 10) || 0);
}

function isVersionAtLeast(version: string | undefined, minimum: string) {
  const current = parseVersion(version);
  const required = parseVersion(minimum);
  const maxLength = Math.max(current.length, required.length);

  for (let index = 0; index < maxLength; index += 1) {
    const currentPart = current[index] || 0;
    const requiredPart = required[index] || 0;
    if (currentPart > requiredPart) return true;
    if (currentPart < requiredPart) return false;
  }

  return true;
}

export function ExtensionBridge({ usernames, config }: {
  usernames: string[];
  config: { delay: number; batchSize: number; batchPause: number };
}) {
  const [ext, setExt] = useState<ExtensionState>({ installed: false, supported: false });
  const [status, setStatus] = useState<"idle" | "starting" | "running" | "paused" | "done" | "error">("idle");
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [error, setError] = useState("");
  const [log, setLog] = useState<string[]>([]);

  const formatLogEntry = useCallback((entry: { username?: string; status?: string; detail?: string; text?: string }) => {
    if (entry.text) return entry.text;
    const icon = entry.status === "success" ? "✓" : entry.status === "skipped" ? "⏭" : entry.status === "failed" ? "✗" : "•";
    return `${icon} @${entry.username || "system"}${entry.detail ? ` — ${entry.detail}` : ""}`;
  }, []);

  const hydrateRuntime = useCallback((runtime: RuntimeResponse) => {
    const stateSnapshot = runtime.state;
    const active = stateSnapshot?.status && ["running", "paused", "stopping"].includes(stateSnapshot.status)
      && ["running", "paused", "stopping"].includes(runtime.contentState || "");
    const terminal = stateSnapshot?.status && ["completed", "stopped"].includes(stateSnapshot.status);
    if (!active && !terminal) return false;

    const stats = stateSnapshot?.stats || {};
    setProgress({
      action: "progress",
      current: stateSnapshot?.current || 0,
      total: stateSnapshot?.total || 0,
      cancelled: stats.cancelled || 0,
      skipped: stats.skipped || 0,
      failed: stats.failed || 0,
      username: stateSnapshot?.currentUsername,
      status: stateSnapshot?.status,
      phase: stateSnapshot?.phase,
      updatedAt: stateSnapshot?.updatedAt,
    });
    setLog((stateSnapshot?.log || []).slice(0, 30).map(formatLogEntry));
    setStatus(terminal ? "done" : runtime.contentState === "paused" || stateSnapshot?.status === "paused" ? "paused" : "running");
    return true;
  }, [formatLogEntry]);

  const detectExtension = useCallback(() => {
    const marker = document.getElementById("instaclean-extension-marker");
    if (marker) {
      const version = marker.dataset.version || "1.0";
      setExt({
        installed: true,
        version,
        supported: isVersionAtLeast(version, MIN_EXTENSION_VERSION),
      });
      return true;
    }

    return false;
  }, []);

  const handleExtensionMessage = useCallback((msg: ProgressData) => {
    setProgress(prev => {
      const clean = Object.fromEntries(Object.entries(msg).filter(([, value]) => value !== undefined)) as ProgressData;
      return { ...(prev || { action: clean.action }), ...clean };
    });

    if (msg.action === "progress") {
      setStatus("running");
      if (msg.username) {
        const icon = msg.status === "success" ? "✓" : msg.status === "skipped" ? "⏭" : "✗";
        const detail = msg.reasonDetail || msg.reasonLabel || "";
        setLog(prev => [`${icon} @${msg.username}${detail ? ` — ${detail}` : ""}`, ...prev].slice(0, 30));
      }
    }
    if (msg.action === "ui_fallback_live") {
      setStatus("running");
      if (msg.username) {
        setLog(prev => [`👁 @${msg.username} — live profiel geopend`, ...prev].slice(0, 30));
      }
    }
    if (msg.action === "heartbeat") {
      setStatus(msg.status === "paused" ? "paused" : "running");
    }
    if (msg.action === "started") setStatus("running");
    if (msg.action === "done") setStatus("done");
    if (msg.action === "already_done") setStatus("done");
    if (msg.action === "error") { setStatus("error"); setError(msg.message || "De extensie gaf geen foutdetails terug."); }
    if (msg.action === "rate_limit") setStatus("running");
    if (msg.action === "rate_limit_pause") setStatus("paused");
  }, []);

  // Detect extension on mount
  useEffect(() => {
    // Listen for messages from extension content script (relayed via background)
    const handler = (event: MessageEvent) => {
      if (event.data?.source === "instaclean-extension") {
        handleExtensionMessage(event.data);
      }
    };
    window.addEventListener("message", handler);

    let attempts = 0;
    const detectionTimer = window.setInterval(() => {
      attempts += 1;
      const found = detectExtension();
      if (found || attempts >= 30) {
        window.clearInterval(detectionTimer);
      }
    }, 500);

    return () => {
      window.clearInterval(detectionTimer);
      window.removeEventListener("message", handler);
    };
  }, [detectExtension, handleExtensionMessage]);

  // Also listen for chrome runtime messages if content script injects a listener
  useEffect(() => {
    // The content script on instaclean.nl can relay messages from the background
    const progressHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) handleExtensionMessage(detail);
    };
    const responseHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;

      if (detail.state) {
        hydrateRuntime(detail);
        return;
      }

      if (detail.ok === false) {
        setStatus("error");
        setError(detail.message || detail.reason || "De extensie kon niet starten.");
        return;
      }

      if (detail.ok === true) {
        setStatus(prev => prev === "starting" ? "running" : prev);
        setProgress(prev => prev || {
          action: "started",
          current: 0,
          total: usernames.length,
          cancelled: 0,
          skipped: 0,
          failed: 0,
        });
      }
    };

    window.addEventListener("instaclean-progress", progressHandler);
    window.addEventListener("instaclean-response", responseHandler);
    return () => {
      window.removeEventListener("instaclean-progress", progressHandler);
      window.removeEventListener("instaclean-response", responseHandler);
    };
  }, [handleExtensionMessage, hydrateRuntime, usernames.length]);

  const sendToExtension = useCallback((action: string, data?: Record<string, unknown>) => {
    // Send via custom event (content script on this page relays to background)
    window.dispatchEvent(new CustomEvent("instaclean-command", {
      detail: { action, ...data }
    }));
  }, []);

  useEffect(() => {
    if (!ext.supported) return;
    sendToExtension("get_state");
    const poller = window.setInterval(() => {
      sendToExtension("get_state");
    }, 5000);
    return () => window.clearInterval(poller);
  }, [ext.supported, sendToExtension]);

  const handleStart = () => {
    if (!ext.supported) {
      setStatus("error");
      setError(`Update de extensie naar v${MIN_EXTENSION_VERSION} of nieuwer. Je browser gebruikt nu v${ext.version || "onbekend"}.`);
      return;
    }

    setStatus("starting");
    setLog([]);
    setProgress(null);
    setError("");

    sendToExtension("start_from_website", {
      usernames,
      config: {
        delay: config.delay * 1000,
        batchSize: config.batchSize,
        batchPause: config.batchPause * 1000,
      },
    });

    // Timeout: if no response in 5s, show error
    setTimeout(() => {
      setStatus(prev => {
        if (prev !== "starting") return prev;
        setError("Geen reactie van de extensie. Zorg dat Instagram.com open is in een andere tab.");
        return "error";
      });
    }, 5000);
  };

  const pct = progress?.total ? Math.round(((progress.current || 0) / progress.total) * 100) : 0;

  // Not installed → show install prompt
  if (!ext.installed) {
    return (
      <div className="rounded-2xl p-6 text-center" style={{ background: "rgba(139,92,246,0.04)", border: "1px solid rgba(139,92,246,0.1)" }}>
        <Globe size={28} className="mx-auto mb-3" style={{ color: "#8B5CF6" }} />
        <h3 className="text-base font-semibold mb-2">Chrome Extensie</h3>
        <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>
          Installeer de InstaClean extensie voor een naadloze ervaring. Geen F12, geen console, geen scripts plakken.
        </p>
        <a
          href="https://chromewebstore.google.com/detail/instaclean-%E2%80%94-instagram-fo/kghddplmggmbgdakmmohleghkahoabfi"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white transition-all duration-300 hover:-translate-y-0.5"
          style={{ background: "linear-gradient(135deg, #D946EF, #8B5CF6)", boxShadow: "0 0 16px rgba(217,70,239,0.2)" }}
        >
          Installeer extensie
          <ArrowRight size={14} />
        </a>
        <p className="text-[10px] mt-3" style={{ color: "rgba(255,255,255,0.15)" }}>
          Of gebruik de script-methode hieronder als fallback.
        </p>
      </div>
    );
  }

  // Old extension versions expose the marker too, but should not be allowed to start.
  if (!ext.supported) {
    return (
      <div className="rounded-2xl p-6 text-center" style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.14)" }}>
        <AlertTriangle size={26} className="mx-auto mb-3 text-amber-400" />
        <h3 className="text-base font-semibold mb-2">Update extensie vereist</h3>
        <p className="text-xs mb-4 leading-relaxed" style={{ color: "rgba(255,255,255,0.42)" }}>
          Je browser gebruikt InstaClean v{ext.version || "onbekend"}, maar deze tool werkt alleen veilig met v{MIN_EXTENSION_VERSION} of nieuwer.
        </p>
        <div className="rounded-xl p-3 text-left text-[11px] leading-relaxed mb-4" style={{ background: "rgba(0,0,0,0.18)", color: "rgba(255,255,255,0.45)" }}>
          Open <span className="font-mono text-amber-300">chrome://extensions</span>, zet de oude Web Store-versie uit of reload de lokale map, en refresh daarna deze pagina.
        </div>
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white opacity-40"
          style={{ background: "linear-gradient(135deg, #D946EF, #8B5CF6)" }}
        >
          Start geblokkeerd tot update
        </button>
      </div>
    );
  }

  // Installed → show bridge UI
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
      {/* Header */}
      <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="flex items-center gap-2">
          <Globe size={14} style={{ color: "#8B5CF6" }} />
          <span className="text-xs font-semibold">Via extensie</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "rgba(16,185,129,0.08)", color: "#10B981" }}>v{ext.version}</span>
        </div>
        {(status === "running" || status === "paused") && progress?.eta && (
          <div className="flex items-center gap-1 text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
            <Clock size={10} />{progress.eta}
          </div>
        )}
      </div>

      <div className="p-5">
        {/* Idle → Start button */}
        {status === "idle" && (
          <div className="text-center py-4">
            <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>
              De extensie annuleert {usernames.length} accounts automatisch op Instagram.
              Zorg dat instagram.com open is in een andere tab.
            </p>
            <button
              onClick={handleStart}
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white cursor-pointer transition-all duration-300 hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg, #D946EF, #8B5CF6)", boxShadow: "0 0 20px rgba(217,70,239,0.2)" }}
            >
              <Zap size={15} />
              Start via extensie
            </button>
          </div>
        )}

        {/* Starting */}
        {status === "starting" && (
          <div className="text-center py-6">
            <Loader2 size={20} className="mx-auto mb-2 animate-spin" style={{ color: "#8B5CF6" }} />
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Verbinden met extensie...</p>
          </div>
        )}

        {/* Running */}
        {(status === "running" || status === "paused") && progress && (
          <div className="space-y-4">
            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-[10px] mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                <span>{progress.current || 0} / {progress.total || 0}</span>
                <span>{pct}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                <div className="h-full rounded-full transition-all duration-400" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #D946EF, #8B5CF6)", boxShadow: "0 0 8px rgba(217,70,239,0.3)" }} />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.015)" }}>
                <div className="text-base font-bold" style={{ color: "#10B981" }}>{progress.cancelled || 0}</div>
                <div className="text-[8px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.2)" }}>Geannuleerd</div>
              </div>
              <div className="text-center p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.015)" }}>
                <div className="text-base font-bold" style={{ color: "rgba(255,255,255,0.3)" }}>{progress.skipped || 0}</div>
                <div className="text-[8px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.2)" }}>Overgeslagen</div>
              </div>
              <div className="text-center p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.015)" }}>
                <div className="text-base font-bold text-red-400">{progress.failed || 0}</div>
                <div className="text-[8px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.2)" }}>Mislukt</div>
              </div>
            </div>

            {/* Rate limit warning */}
            {(progress.action === "rate_limit" || progress.action === "rate_limit_pause") && (
              <div className="rounded-lg p-3" style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.1)" }}>
                <p className="text-[11px] text-amber-400">{progress.message}</p>
              </div>
            )}

            {/* Log */}
            {log.length > 0 && (
              <div className="rounded-lg p-2.5 max-h-[80px] overflow-y-auto font-mono text-[9px] leading-relaxed" style={{ background: "rgba(0,0,0,0.2)" }}>
                {log.slice(0, 10).map((line, i) => (
                  <div key={i} style={{ opacity: 1 - i * 0.08, color: line.startsWith("✓") ? "rgba(16,185,129,0.6)" : line.startsWith("⏭") ? "rgba(255,255,255,0.2)" : "rgba(239,68,68,0.5)" }}>{line}</div>
                ))}
              </div>
            )}

            {/* Controls */}
            <div className="flex gap-2">
              <button onClick={() => {
                const nextAction = status === "paused" ? "resume" : "pause";
                sendToExtension(nextAction);
                setStatus(nextAction === "resume" ? "running" : "paused");
              }} className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] cursor-pointer transition-colors" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
                <Pause size={11} />{status === "paused" ? "Hervat" : "Pauzeer"}
              </button>
              <button onClick={() => { sendToExtension("stop"); setStatus("paused"); }} className="flex items-center justify-center gap-1.5 rounded-lg py-2 px-4 text-[11px] cursor-pointer transition-colors" style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.1)", color: "rgba(239,68,68,0.6)" }}>
                <Square size={11} />Stop
              </button>
            </div>
          </div>
        )}

        {/* Done */}
        {status === "done" && (
          <div className="text-center py-4">
            <CheckCircle size={24} className="mx-auto mb-2" style={{ color: "#10B981" }} />
            <p className="text-sm font-semibold mb-1">Klaar!</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              {progress?.cancelled || 0} requests geannuleerd
              {progress?.stopped ? " voordat je stopte" : ""}
              {progress?.durationMs ? ` in ${Math.round(progress.durationMs / 60000)} min` : ""}
            </p>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className="text-center py-4">
            <AlertTriangle size={20} className="mx-auto mb-2 text-amber-400" />
            <p className="text-xs text-amber-400 mb-3">{error}</p>
            <button onClick={() => setStatus("idle")} className="text-[11px] cursor-pointer" style={{ color: "rgba(255,255,255,0.3)" }}>
              Opnieuw proberen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
