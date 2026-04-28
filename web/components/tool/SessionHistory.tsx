"use client";

import { useState } from "react";
import { History, CheckCircle, Clock } from "lucide-react";

interface Run {
  date: string;
  total: number;
  cancelled: number;
  skipped: number;
  failed: number;
  status: string;
  durationMs: number;
}

export function SessionHistory() {
  const [runs] = useState<Run[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("instaclean_history") || "[]");
    } catch {
      return [];
    }
  });
  const [progressCount, setProgressCount] = useState(() => {
    if (typeof window === "undefined") return 0;
    try {
      const progress = JSON.parse(localStorage.getItem("instaclean_progress") || "[]");
      return Array.isArray(progress) ? progress.length : 0;
    } catch {
      return 0;
    }
  });

  if (runs.length === 0 && progressCount === 0) return null;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <History size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
        <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>Eerdere sessies</span>
      </div>

      {/* Current progress */}
      {progressCount > 0 && (
        <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green" style={{ boxShadow: "0 0 4px #10B981" }} />
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{progressCount} usernames eerder verwerkt</span>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("instaclean_progress");
              setProgressCount(0);
            }}
            className="text-[10px] cursor-pointer transition-colors"
            style={{ color: "rgba(255,255,255,0.2)" }}
          >
            Wis progress
          </button>
        </div>
      )}

      {/* History */}
      {runs.length > 0 && (
        <div className="px-5 py-3 space-y-2">
          {runs.slice(0, 3).map((run, i) => {
            const date = new Date(run.date);
            const mins = Math.round(run.durationMs / 60000);
            return (
              <div key={i} className="flex items-center justify-between text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                <div className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-green/60" />
                  <span>{run.cancelled} geannuleerd</span>
                  {run.skipped > 0 && <span className="text-white/15">({run.skipped} overgeslagen)</span>}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={10} />
                  <span>{mins}min &middot; {date.toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
