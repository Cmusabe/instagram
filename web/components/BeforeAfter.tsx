"use client";

import { useEffect, useRef, useState } from "react";

const NAMES = [
  "user_12345", "travel_adv", "photo_daily", "fitness.q",
  "amsterdam_l", "music_lov", "style_sara", "chef_mo",
];

export function BeforeAfter() {
  const [phase, setPhase] = useState<"before" | "transitioning" | "after">("before");
  const [fadedCount, setFadedCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          runLoop();
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function runLoop() {
    // Show "before" for 2.5s
    setPhase("before");
    setFadedCount(0);

    setTimeout(() => {
      // Transition: fade items one by one
      setPhase("transitioning");
      for (let i = 0; i < NAMES.length; i++) {
        setTimeout(() => setFadedCount(i + 1), i * 200);
      }

      // After all faded, show "after"
      setTimeout(() => {
        setPhase("after");
      }, NAMES.length * 200 + 400);

      // Hold "after" for 3s, then restart
      setTimeout(() => {
        runLoop();
      }, NAMES.length * 200 + 3500);
    }, 2500);
  }

  const isAfter = phase === "after";
  const pendingCount = NAMES.length - fadedCount;

  return (
    <div ref={ref} className="max-w-lg mx-auto">
      {/* Single card that morphs */}
      <div
        className="rounded-2xl overflow-hidden transition-all duration-500"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: `1px solid ${isAfter ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.06)"}`,
          backdropFilter: "blur(12px)",
          boxShadow: isAfter ? "0 0 40px rgba(16,185,129,0.05)" : "0 25px 50px rgba(0,0,0,0.3)",
        }}
      >
        {/* Header */}
        <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
          <span className="text-[10px] text-white/30 font-mono">instagram.com/pending</span>
          <span
            className="text-[10px] font-medium px-2.5 py-0.5 rounded-full transition-all duration-500"
            style={{
              background: isAfter ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
              color: isAfter ? "#10b981" : "#f87171",
            }}
          >
            {isAfter ? "After" : "Before"}
          </span>
        </div>

        {/* Counter */}
        <div className="px-5 pt-4 pb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-text">Pending Requests</p>
          <span
            className="text-2xl font-extrabold tabular-nums transition-all duration-500"
            style={{ color: isAfter ? "#10b981" : "#f87171" }}
          >
            {isAfter ? "0" : phase === "transitioning" ? pendingCount : NAMES.length}
          </span>
        </div>

        {/* Content */}
        <div className="px-5 pb-5 min-h-[200px]">
          {isAfter ? (
            /* After state */
            <div className="flex flex-col items-center justify-center py-8" style={{ animation: "fadeIn 0.5s ease-out" }}>
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-3"
                style={{
                  background: "rgba(16,185,129,0.1)",
                  animation: "fadeInUp 0.5s ease-out",
                }}
              >
                <span className="text-emerald-400">&#10003;</span>
              </div>
              <p className="text-base font-semibold text-emerald-400">Alles opgeruimd!</p>
              <p className="text-xs text-white/30 mt-1">0 pending follow requests</p>
            </div>
          ) : (
            /* Before / transitioning state */
            <div className="space-y-1">
              {NAMES.map((name, i) => {
                const isFaded = i < fadedCount;
                return (
                  <div
                    key={name}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded transition-all duration-400"
                    style={{
                      background: isFaded ? "transparent" : "rgba(255,255,255,0.02)",
                      opacity: isFaded ? 0 : 1,
                      transform: isFaded ? "translateX(-20px) scale(0.95)" : "translateX(0)",
                      textDecoration: isFaded ? "line-through" : "none",
                    }}
                  >
                    <div className="w-5 h-5 rounded-full bg-red-500/20 flex-shrink-0" />
                    <span className="text-[11px] text-white/50 font-mono flex-1">@{name}</span>
                    {isFaded ? (
                      <span className="text-emerald-400 text-xs">&#10003;</span>
                    ) : (
                      <span className="text-[9px] text-red-400/60">Pending</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
