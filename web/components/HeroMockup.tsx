"use client";

import { useEffect, useState, useRef, useCallback } from "react";

const USERS = [
  { name: "travel_adventures", hue: 340 },
  { name: "photo_daily", hue: 270 },
  { name: "fitness.queen", hue: 200 },
  { name: "amsterdam_life", hue: 155 },
  { name: "music_lover_x", hue: 30 },
  { name: "foodie_nl", hue: 310 },
];

export function HeroMockup() {
  const [shown, setShown] = useState(0);
  const [removed, setRemoved] = useState<Set<number>>(new Set());
  const [processed, setProcessed] = useState(0);
  const [overlay, setOverlay] = useState(false);
  const [done, setDone] = useState(false);
  const [hover, setHover] = useState(false);
  const ts = useRef<ReturnType<typeof setTimeout>[]>([]);

  const q = useCallback((fn: () => void, ms: number) => {
    ts.current.push(setTimeout(fn, ms));
  }, []);

  const run = useCallback(() => {
    ts.current.forEach(clearTimeout);
    ts.current = [];
    setShown(0); setRemoved(new Set()); setProcessed(0);
    setOverlay(false); setDone(false);

    // Phase 1: show users
    for (let i = 0; i < 6; i++) q(() => setShown(i + 1), 200 + i * 150);

    // Phase 2: overlay
    q(() => setOverlay(true), 2000);

    // Phase 3: remove
    for (let i = 0; i < 6; i++) {
      q(() => {
        setRemoved(prev => new Set(prev).add(i));
        setProcessed(i + 1);
      }, 3000 + i * 1000);
    }

    // Phase 4: done
    q(() => setDone(true), 3000 + 6 * 1000 + 500);

    // Phase 5: reset
    q(() => run(), 3000 + 6 * 1000 + 2500);
  }, [q]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(6); setProcessed(6); setDone(true); setOverlay(true);
      setRemoved(new Set([0,1,2,3,4,5]));
      return;
    }
    run();
    return () => ts.current.forEach(clearTimeout);
  }, [run]);

  const pct = Math.round((processed / 6) * 100);

  return (
    <div
      className="relative will-change-transform"
      style={{ animation: "float 6s ease-in-out infinite" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.05) inset, 0 20px 50px -20px rgba(0,0,0,0.5), 0 40px 100px -40px rgba(139,92,246,0.12)",
          backdropFilter: "blur(40px)",
          transform: hover
            ? "perspective(1200px) rotateY(0deg) rotateX(0deg)"
            : "perspective(1200px) rotateY(-4deg) rotateX(2deg)",
          transition: "transform 0.8s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {/* Chrome */}
        <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="flex gap-[5px]">
            <div className="w-[9px] h-[9px] rounded-full bg-white/10" />
            <div className="w-[9px] h-[9px] rounded-full bg-white/10" />
            <div className="w-[9px] h-[9px] rounded-full bg-white/10" />
          </div>
          <div className="flex-1 flex justify-center">
            <span className="text-[10px] font-mono text-white/15 px-3 py-[2px] rounded" style={{ background: "rgba(255,255,255,0.02)" }}>
              instagram.com/pending
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="relative min-h-[340px] p-3">
          <div className="space-y-[5px]">
            {USERS.map((u, i) => {
              const vis = i < shown;
              const gone = removed.has(i);
              return (
                <div
                  key={u.name}
                  className="flex items-center gap-3 px-3 py-[10px] rounded-lg"
                  style={{
                    background: gone ? "transparent" : "rgba(255,255,255,0.015)",
                    opacity: gone ? 0 : vis ? 1 : 0,
                    transform: gone ? "translateX(-30px)" : vis ? "translateX(0)" : "translateX(12px)",
                    transition: `all ${gone ? "0.5s" : "0.4s"} cubic-bezier(0.4,0,0,1)`,
                  }}
                >
                  <div
                    className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[8px] font-bold text-white/90 flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, hsl(${u.hue},70%,55%), hsl(${u.hue + 30},65%,45%))` }}
                  >
                    {u.name[0].toUpperCase()}
                  </div>
                  <span className="text-[11px] font-mono text-white/45 flex-1 truncate">@{u.name}</span>
                  {gone ? (
                    <span className="text-green text-[11px] font-medium">{"\u2713"}</span>
                  ) : (
                    <span className="text-[9px] text-white/20 px-2 py-[2px] rounded" style={{ background: "rgba(255,255,255,0.03)" }}>Requested</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Done state */}
          {done && processed === 6 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ animation: "fadeUp 0.5s cubic-bezier(0.22,1,0.36,1)" }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-3" style={{ background: "rgba(16,185,129,0.08)", color: "#10B981" }}>
                {"\u2713"}
              </div>
              <p className="text-sm font-semibold text-green">Klaar!</p>
              <p className="text-[11px] text-white/25 mt-1">6 requests geannuleerd</p>
            </div>
          )}

          {/* Overlay toolbar */}
          <div
            className="absolute bottom-0 inset-x-0 p-3"
            style={{
              background: "linear-gradient(to top, rgba(7,7,13,0.97) 60%, transparent)",
              opacity: overlay ? 1 : 0,
              transform: overlay ? "translateY(0)" : "translateY(20px)",
              transition: "all 0.5s cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="flex items-center justify-between mb-2">
                <img src="/logo/instaclean-logo.png" alt="InstaClean" className="h-4 w-auto" />
                <span className="text-[9px] font-mono text-white/25 tabular-nums">{processed}/6</span>
              </div>
              <div className="h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: done ? "#10B981" : "linear-gradient(90deg, #D946EF, #8B5CF6)", transition: "width 0.3s ease" }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shadow glow */}
      <div className="absolute -bottom-8 left-[15%] right-[15%] h-12 rounded-full blur-[40px] pointer-events-none" style={{ background: "rgba(139,92,246,0.08)" }} />
    </div>
  );
}
