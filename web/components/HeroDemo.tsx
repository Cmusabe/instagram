"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";

const USERS = [
  { name: "travel_adventures", hue: 340 },
  { name: "photo_daily", hue: 270 },
  { name: "fitness_queen", hue: 200 },
  { name: "amsterdam_life", hue: 160 },
  { name: "music_lover", hue: 30 },
  { name: "foodie_nl", hue: 310 },
];

type Phase = 0 | 1 | 2 | 3 | 4;

export function HeroDemo() {
  const [phase, setPhase] = useState<Phase>(0);
  const [shown, setShown] = useState(0);
  const [removed, setRemoved] = useState<Set<number>>(new Set());
  const [processed, setProcessed] = useState(0);
  const [hover, setHover] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const t = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
  }, []);

  const run = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPhase(0); setShown(0); setRemoved(new Set()); setProcessed(0);

    // Phase 1: stagger users in
    t(() => setPhase(1), 200);
    for (let i = 0; i < USERS.length; i++) t(() => setShown(i + 1), 300 + i * 180);

    // Phase 2: overlay appears
    t(() => setPhase(2), 1700);

    // Phase 3: remove one by one
    t(() => setPhase(3), 2400);
    for (let i = 0; i < USERS.length; i++) {
      t(() => { setRemoved(p => new Set(p).add(i)); setProcessed(i + 1); }, 2700 + i * 550);
    }

    // Phase 4: done
    t(() => setPhase(4), 2700 + USERS.length * 550 + 400);

    // Reset
    t(() => run(), 2700 + USERS.length * 550 + 3200);
  }, [t]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase(4); setShown(6); setProcessed(6);
      setRemoved(new Set([0,1,2,3,4,5]));
      return;
    }
    run();
    return () => timers.current.forEach(clearTimeout);
  }, [run]);

  const progress = Math.round((processed / USERS.length) * 100);
  const done = phase === 4;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "rgba(12,12,22,0.85)",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 30px 70px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03) inset",
          transform: hover
            ? "perspective(1200px) rotateY(0deg) rotateX(0deg)"
            : "perspective(1200px) rotateY(-4deg) rotateX(2deg)",
          transition: "transform 0.6s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {/* Chrome */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.05]">
          <div className="flex gap-[6px]">
            <div className="w-[10px] h-[10px] rounded-full bg-[#ff5f57]/80" />
            <div className="w-[10px] h-[10px] rounded-full bg-[#ffbd2e]/80" />
            <div className="w-[10px] h-[10px] rounded-full bg-[#28c840]/80" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="px-4 py-[3px] rounded-md text-[10px] text-white/20 font-mono" style={{ background: "rgba(255,255,255,0.03)" }}>
              instagram.com/pending
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="relative min-h-[310px] p-3">
          <div className="space-y-[6px]">
            {USERS.map((u, i) => {
              const visible = i < shown;
              const gone = removed.has(i);
              return (
                <div
                  key={u.name}
                  className="flex items-center gap-3 px-3 py-[9px] rounded-lg"
                  style={{
                    background: gone ? "transparent" : "rgba(255,255,255,0.02)",
                    opacity: gone ? 0 : visible ? 1 : 0,
                    transform: gone ? "translateX(-30px) scale(0.95)" : visible ? "translateX(0)" : "translateX(16px)",
                    transition: "all 0.45s cubic-bezier(0.22,1,0.36,1)",
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                    style={{ background: `hsl(${u.hue}, 75%, 55%)` }}
                  >
                    {u.name[0].toUpperCase()}
                  </div>
                  <span className="text-[11px] text-white/60 font-mono flex-1 truncate">@{u.name}</span>
                  {gone ? (
                    <span className="text-emerald-400 text-[11px] font-semibold">&#10003;</span>
                  ) : (
                    <span className="text-[9px] text-white/30 px-2 py-[2px] rounded-md" style={{ background: "rgba(255,255,255,0.04)" }}>Requested</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Overlay */}
          <div
            className="absolute bottom-0 inset-x-0 p-3"
            style={{
              background: "linear-gradient(to top, rgba(7,7,13,0.97) 70%, transparent)",
              opacity: phase >= 2 ? 1 : 0,
              transform: phase >= 2 ? "translateY(0)" : "translateY(24px)",
              transition: "all 0.5s cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-gradient">InstaClean</span>
                <span className="text-[10px] text-white/30 font-mono tabular-nums">{processed}/{USERS.length}</span>
              </div>
              <div className="h-[5px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${progress}%`,
                    background: done ? "#10B981" : "linear-gradient(90deg, #D946EF, #8B5CF6)",
                    transition: "width 0.35s ease, background 0.3s",
                    boxShadow: done ? "0 0 8px rgba(16,185,129,0.4)" : "0 0 8px rgba(217,70,239,0.3)",
                  }}
                />
              </div>
              <p className="text-[10px] text-center mt-2 font-medium" style={{ color: done ? "#10B981" : "rgba(255,255,255,0.35)" }}>
                {done ? `\u2713 Klaar! ${USERS.length} requests geannuleerd` : phase >= 3 ? "Bezig met annuleren..." : `${USERS.length} pending requests`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Underglow */}
      <div className="absolute -bottom-6 left-[10%] right-[10%] h-16 rounded-full blur-[50px] pointer-events-none" style={{ background: "rgba(217,70,239,0.1)" }} aria-hidden="true" />
    </motion.div>
  );
}
