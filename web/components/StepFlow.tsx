"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { Upload, Settings, Play } from "lucide-react";

const CONSOLE_NL = [
  { t: "InstaClean v2.1 gestart...", d: 0 },
  { t: "247 accounts geladen", d: 500 },
  { t: "Verwerken: @user_123 \u2713", d: 1000 },
  { t: "Verwerken: @travel_adventures \u2713", d: 1500 },
  { t: "Verwerken: @photo_daily \u2713", d: 2000 },
  { t: "Verwerken: @fitness_queen \u2713", d: 2500 },
  { t: "\u2713 Klaar! Alle requests geannuleerd", d: 3000 },
];

const CONSOLE_EN = [
  { t: "InstaClean v2.1 started...", d: 0 },
  { t: "247 accounts loaded", d: 500 },
  { t: "Processing: @user_123 \u2713", d: 1000 },
  { t: "Processing: @travel_adventures \u2713", d: 1500 },
  { t: "Processing: @photo_daily \u2713", d: 2000 },
  { t: "Processing: @fitness_queen \u2713", d: 2500 },
  { t: "\u2713 Done! All requests cancelled", d: 3000 },
];

const STEPS_NL = [
  { n: 1, icon: <Upload size={18} />, title: "Upload je data", desc: "Upload je Instagram export en wij extraheren alle usernames." },
  { n: 2, icon: <Settings size={18} />, title: "Configureer", desc: "Stel snelheid en batch-grootte in." },
  { n: 3, icon: <Play size={18} />, title: "Voer uit", desc: "Plak het script in je browser console." },
];

const STEPS_EN = [
  { n: 1, icon: <Upload size={18} />, title: "Upload your data", desc: "Upload your Instagram export and we extract all usernames." },
  { n: 2, icon: <Settings size={18} />, title: "Configure", desc: "Set speed and batch size." },
  { n: 3, icon: <Play size={18} />, title: "Execute", desc: "Paste the script in your browser console." },
];

const NAMES_NL = ["@travel_adventures", "@photo_daily", "@user_123", "@fitness_queen", "@amsterdam_life"];
const FOUND_NL = "247 usernames gevonden";
const FOUND_EN = "247 usernames found";
const DRAG_NL = "Sleep een bestand hierheen";
const DRAG_EN = "Drag a file here";
const EST_NL = "Geschatte tijd";
const EST_EN = "Estimated time";

function Panel({ step, isEN }: { step: number; isEN: boolean }) {
  const [uploadDone, setUploadDone] = useState(false);
  const [names, setNames] = useState(0);
  const [slider, setSlider] = useState(0);
  const [lines, setLines] = useState(0);
  const [progress, setProgress] = useState(0);
  const CONSOLE = isEN ? CONSOLE_EN : CONSOLE_NL;

  useEffect(() => {
    const ts: ReturnType<typeof setTimeout>[] = [];
    if (step === 1) {
      setUploadDone(false); setNames(0);
      ts.push(setTimeout(() => setUploadDone(true), 700));
      for (let i = 0; i < 5; i++) ts.push(setTimeout(() => setNames(i + 1), 1200 + i * 120));
    }
    if (step === 2) {
      setSlider(0);
      let v = 0;
      const id = setInterval(() => { v += 3; setSlider(Math.min(v, 65)); if (v >= 65) clearInterval(id); }, 40);
      return () => clearInterval(id);
    }
    if (step === 3) {
      setLines(0); setProgress(0);
      CONSOLE.forEach((_, i) => ts.push(setTimeout(() => {
        setLines(i + 1);
        setProgress(Math.round(((i + 1) / CONSOLE.length) * 100));
      }, CONSOLE[i].d)));
    }
    return () => ts.forEach(clearTimeout);
  }, [step, CONSOLE]);

  if (step === 1) return (
    <div className="space-y-3">
      <div className="flex items-center justify-center rounded-xl border border-dashed py-8 transition-all duration-500" style={{ borderColor: uploadDone ? "#10B981" : "rgba(255,255,255,0.08)", background: uploadDone ? "rgba(16,185,129,0.03)" : "transparent" }}>
        <div className={`text-lg ${uploadDone ? "text-emerald-400" : "text-white/20"}`}>{uploadDone ? "\u2713" : "\uD83D\uDCC4"}</div>
        <span className="ml-2 text-xs text-white/40">{uploadDone ? "pending_follow_requests.html" : (isEN ? DRAG_EN : DRAG_NL)}</span>
      </div>
      {names > 0 && (
        <div className="space-y-1">
          {NAMES_NL.slice(0, names).map((u, i) => (
            <div key={u} className="flex items-center gap-2 px-3 py-1.5 rounded text-[11px] text-white/50 font-mono" style={{ background: "rgba(255,255,255,0.02)", animation: `fadeUp 0.3s ${i * 0.06}s both` }}>
              <span className="text-emerald-400 text-[9px]">{"\u2713"}</span> {u}
            </div>
          ))}
          <p className="text-[10px] text-emerald-400 text-center font-medium mt-2">{isEN ? FOUND_EN : FOUND_NL} {"\u2713"}</p>
        </div>
      )}
    </div>
  );

  if (step === 2) return (
    <div className="space-y-4">
      {[
        { l: isEN ? "Speed" : "Snelheid", v: Math.round(slider / 10) + 1, u: "s" },
        { l: isEN ? "Batch size" : "Batch grootte", v: Math.round(slider * 0.77), u: "" },
      ].map((s) => (
        <div key={s.l}>
          <div className="flex justify-between text-[11px] text-white/40 mb-1.5"><span>{s.l}</span><span className="font-mono text-white/60">{s.v}{s.u}</span></div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-full" style={{ width: `${slider}%`, background: "linear-gradient(90deg, #D946EF, #8B5CF6)", transition: "width 50ms" }} />
          </div>
        </div>
      ))}
      <div className="mt-4 p-3 rounded-lg text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
        <span className="text-[10px] text-white/30">{isEN ? EST_EN : EST_NL}</span>
        <p className="text-sm font-bold text-grad mt-0.5">~12 {isEN ? "minutes" : "minuten"}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="rounded-lg overflow-hidden font-mono text-[10px]" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-white/[0.04]">
          <div className="w-2 h-2 rounded-full bg-[#ff5f57]/60" /><div className="w-2 h-2 rounded-full bg-[#ffbd2e]/60" /><div className="w-2 h-2 rounded-full bg-[#28c840]/60" />
          <span className="text-white/15 ml-1">console</span>
        </div>
        <div className="p-3 min-h-[120px] leading-relaxed">
          {CONSOLE.slice(0, lines).map((line, i) => (
            <div key={i} className={line.t.startsWith("\u2713") ? "text-emerald-400" : "text-green-400/70"} style={{ animation: "fadeUp 0.2s ease-out" }}>{line.t}</div>
          ))}
          {lines > 0 && lines < CONSOLE.length && <span className="inline-block w-[5px] h-3 bg-green-400/60" style={{ animation: "cursorBlink 0.8s step-end infinite" }} />}
        </div>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full" style={{ width: `${progress}%`, background: progress >= 100 ? "#10B981" : "linear-gradient(90deg, #D946EF, #8B5CF6)", transition: "width 0.4s" }} />
      </div>
    </div>
  );
}

export function StepFlow() {
  const pathname = usePathname();
  const isEN = pathname.startsWith("/en");
  const STEPS = isEN ? STEPS_EN : STEPS_NL;

  const [active, setActive] = useState(1);
  const [key, setKey] = useState(0);
  const paused = useRef(0);

  const go = useCallback((n: number) => {
    setActive(n); setKey(k => k + 1);
    paused.current = Date.now() + 10000;
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const iv = setInterval(() => {
      if (Date.now() < paused.current) return;
      setActive(p => { const n = p >= 3 ? 1 : p + 1; setKey(k => k + 1); return n; });
    }, 4500);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="grid lg:grid-cols-[260px_1fr] gap-6 lg:gap-10 items-start">
      <div className="relative flex lg:flex-col gap-2">
        <div className="hidden lg:block absolute left-[18px] top-10 bottom-10 w-[2px]" style={{ background: "linear-gradient(to bottom, #D946EF, #8B5CF6)" }} />
        {STEPS.map((s) => (
          <button key={s.n} onClick={() => go(s.n)} className="relative flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-300 cursor-pointer w-full" style={{ background: active === s.n ? "rgba(217,70,239,0.06)" : "transparent", border: `1px solid ${active === s.n ? "rgba(217,70,239,0.15)" : "transparent"}` }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 relative z-10" style={{ background: active === s.n ? "linear-gradient(135deg, #D946EF, #8B5CF6)" : "rgba(255,255,255,0.04)", color: active === s.n ? "white" : "rgba(255,255,255,0.3)", boxShadow: active === s.n ? "0 0 16px rgba(217,70,239,0.3)" : "none" }}>
              {s.icon}
            </div>
            <div className="hidden lg:block min-w-0">
              <p className={`text-xs font-semibold truncate ${active === s.n ? "text-white/90" : "text-white/50"}`}>{s.title}</p>
              <p className="text-[10px] text-white/20 truncate">{s.desc}</p>
            </div>
          </button>
        ))}
      </div>
      <div key={key} className="rounded-2xl p-5 min-h-[260px]" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", animation: "fadeUp 0.35s cubic-bezier(0.22,1,0.36,1)" }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white" style={{ background: "linear-gradient(135deg, #D946EF, #8B5CF6)" }}>{active}</div>
          <h3 className="text-sm font-semibold">{STEPS[active - 1].title}</h3>
        </div>
        <Panel step={active} isEN={isEN} />
      </div>
    </div>
  );
}
