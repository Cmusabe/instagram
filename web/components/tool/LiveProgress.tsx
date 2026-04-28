"use client";

import { useEffect, useState } from "react";
import { Activity, CheckCircle, AlertTriangle, Clock, Pause, Zap, RotateCcw, Info } from "lucide-react";

interface ProgressData {
  type: string;
  current?: string;
  index?: number;
  total?: number;
  cancelled?: number;
  skipped?: number;
  failed?: number;
  eta?: string;
  message?: string;
  waitMs?: number;
  durationMs?: number;
  previouslyCompleted?: number;
}

export function LiveProgress() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [connected, setConnected] = useState(() => typeof BroadcastChannel !== "undefined");
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    let connectedTimer: number | null = null;
    try {
      channel = new BroadcastChannel("instaclean_progress");
      connectedTimer = window.setTimeout(() => setConnected(true), 0);

      channel.onmessage = (event: MessageEvent) => {
        const msg = event.data as ProgressData;
        setData(msg);

        if (msg.type === "progress" && msg.current) {
          setLog((prev) => [`\u2713 @${msg.current}`, ...prev].slice(0, 50));
        }
        if (msg.type === "rate_limit") {
          setLog((prev) => [`\u26a0 ${msg.message}`, ...prev].slice(0, 50));
        }
        if (msg.type === "error") {
          setLog((prev) => [`\u2716 ${msg.message}`, ...prev].slice(0, 50));
        }
      };
    } catch {
      connectedTimer = window.setTimeout(() => setConnected(false), 0);
    }

    return () => {
      if (connectedTimer !== null) window.clearTimeout(connectedTimer);
      if (channel) channel.close();
    };
  }, []);

  // Waiting state
  if (!data) {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="w-10 h-10 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(139,92,246,0.06)" }}>
          <Activity size={18} style={{ color: "rgba(139,92,246,0.4)" }} />
        </div>
        <p className="text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>
          {connected ? "Wacht op script..." : "BroadcastChannel niet beschikbaar"}
        </p>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
          Plak het script in de Instagram console en druk Enter. Laat dit tabblad open.
        </p>
      </div>
    );
  }

  // Already done — all usernames were previously processed
  if (data.type === "already_done") {
    return (
      <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(6,182,212,0.06)" }}>
            <Info size={16} style={{ color: "#06B6D4" }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold mb-1">Alles al verwerkt</p>
            <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
              Alle {data.total} usernames zijn eerder al verwerkt ({data.previouslyCompleted} in vorige sessies). Het script heeft niks nieuws te doen.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => {
                  localStorage.removeItem("instaclean_progress");
                  setData(null);
                }}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium cursor-pointer transition-all duration-300 hover:-translate-y-0.5"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}
              >
                <RotateCcw size={12} />
                Wis progress &amp; begin opnieuw
              </button>
              <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.15)" }}>
                Genereer daarna een nieuw script
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isDone = data.type === "done";
  const isRateLimited = data.type === "rate_limit";
  const isPaused = data.type === "batch_pause";
  const total = data.total || 0;
  const processed = (data.cancelled || 0) + (data.skipped || 0) + (data.failed || 0);
  const pct = total > 0 ? Math.round((processed / total) * 100) : 0;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="flex items-center gap-2.5">
          {isDone ? (
            <CheckCircle size={16} style={{ color: "#10B981" }} />
          ) : isRateLimited ? (
            <AlertTriangle size={16} className="text-amber-400" />
          ) : isPaused ? (
            <Pause size={16} style={{ color: "#8B5CF6" }} />
          ) : (
            <div className="w-2 h-2 rounded-full" style={{ background: "#10B981", animation: "pulse 1.5s ease-in-out infinite", boxShadow: "0 0 6px #10B981" }} />
          )}
          <span className="text-sm font-semibold">
            {isDone ? "Voltooid!" : isRateLimited ? "Rate limit \u2014 wachten" : isPaused ? "Batch pauze" : "Bezig met annuleren..."}
          </span>
        </div>
        {data.eta && !isDone && (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
            <Clock size={11} />
            {data.eta}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="px-5 pt-4">
        <div className="flex items-center justify-between text-xs mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
          <span>{processed}/{total} accounts</span>
          <span className="font-mono">{pct}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: isDone ? "#10B981" : isRateLimited ? "#f59e0b" : "linear-gradient(90deg, #D946EF, #8B5CF6)",
              boxShadow: isDone ? "0 0 8px rgba(16,185,129,0.3)" : "0 0 8px rgba(217,70,239,0.2)",
            }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 py-4 grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-lg font-bold" style={{ color: "#10B981" }}>{data.cancelled || 0}</div>
          <p className="text-[9px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.2)" }}>Geannuleerd</p>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold" style={{ color: "rgba(255,255,255,0.35)" }}>{data.skipped || 0}</div>
          <p className="text-[9px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.2)" }}>Overgeslagen</p>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-red-400">{data.failed || 0}</div>
          <p className="text-[9px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.2)" }}>Mislukt</p>
        </div>
      </div>

      {/* Done summary */}
      {isDone && data.durationMs != null && (
        <div className="mx-5 mb-4 p-3 rounded-xl text-center" style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.1)" }}>
          <p className="text-sm font-medium" style={{ color: "#10B981" }}>
            {"\u2713"} Klaar! {data.cancelled} requests geannuleerd in {Math.round((data.durationMs || 0) / 60000)} minuten
          </p>
        </div>
      )}

      {/* Rate limit */}
      {isRateLimited && data.message && (
        <div className="mx-5 mb-4 p-3 rounded-xl" style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.1)" }}>
          <p className="text-xs text-amber-400">{data.message}</p>
        </div>
      )}

      {/* Log */}
      {log.length > 0 && !isDone && (
        <div className="px-5 pb-4">
          <div className="rounded-lg p-3 max-h-[100px] overflow-y-auto font-mono text-[10px] leading-relaxed" style={{ background: "rgba(0,0,0,0.25)" }}>
            {log.slice(0, 8).map((line, i) => (
              <div key={i} style={{ opacity: 1 - i * 0.1, color: line.startsWith("\u2713") ? "rgba(16,185,129,0.6)" : line.startsWith("\u26a0") ? "rgba(245,158,11,0.6)" : "rgba(239,68,68,0.6)" }}>
                {line}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current */}
      {data.current && !isDone && !isRateLimited && (
        <div className="px-5 pb-4 flex items-center gap-2">
          <Zap size={10} style={{ color: "#8B5CF6" }} />
          <span className="text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.25)" }}>@{data.current}</span>
        </div>
      )}
    </div>
  );
}
