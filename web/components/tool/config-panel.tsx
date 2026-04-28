"use client";

import { Timer, Layers, Pause, Shield, Zap, Scale } from "lucide-react";
import { PRESETS } from "@/lib/generate-script";
import type { ReactNode } from "react";

interface Props {
  delay: number;
  batchSize: number;
  batchPause: number;
  onDelayChange: (v: number) => void;
  onBatchSizeChange: (v: number) => void;
  onBatchPauseChange: (v: number) => void;
}

const PRESET_ICONS: Record<string, ReactNode> = {
  safe: <Shield size={14} />,
  balanced: <Scale size={14} />,
  fast: <Zap size={14} />,
};

function Slider({ icon, label, value, unit, min, max, step, onChange, leftLabel, rightLabel }: {
  icon: ReactNode; label: string; value: number; unit: string;
  min: number; max: number; step: number; onChange: (v: number) => void;
  leftLabel: string; rightLabel: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="p-4 rounded-xl transition-all duration-300 hover:bg-white/[0.01]" style={{ border: "1px solid rgba(255,255,255,0.03)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span style={{ color: "#8B5CF6" }}>{icon}</span>
          <label className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</label>
        </div>
        <span className="text-sm font-bold tabular-nums text-grad">{value}{unit}</span>
      </div>
      <div className="relative">
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-[3px] rounded-full" style={{ background: "rgba(255,255,255,0.04)" }} />
        <div className="absolute top-1/2 -translate-y-1/2 left-0 h-[3px] rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #D946EF, #8B5CF6)", boxShadow: "0 0 6px rgba(217,70,239,0.2)" }} />
        <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="relative w-full" style={{ background: "transparent" }} />
      </div>
      <div className="flex justify-between text-[10px] mt-1.5" style={{ color: "rgba(255,255,255,0.2)" }}>
        <span>{leftLabel}</span><span>{rightLabel}</span>
      </div>
    </div>
  );
}

export function ConfigPanel({ delay, batchSize, batchPause, onDelayChange, onBatchSizeChange, onBatchPauseChange }: Props) {
  const applyPreset = (key: keyof typeof PRESETS) => {
    const p = PRESETS[key];
    onDelayChange(p.delay);
    onBatchSizeChange(p.batchSize);
    onBatchPauseChange(p.batchPause);
  };

  return (
    <div className="space-y-4">
      {/* Presets */}
      <div>
        <p className="text-xs font-medium mb-2.5" style={{ color: "rgba(255,255,255,0.4)" }}>Snelle instelling</p>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(PRESETS) as (keyof typeof PRESETS)[]).map((key) => {
            const p = PRESETS[key];
            const isActive = delay === p.delay && batchSize === p.batchSize && batchPause === p.batchPause;
            return (
              <button
                key={key}
                onClick={() => applyPreset(key)}
                className="flex flex-col items-center gap-1.5 rounded-xl px-3 py-3 text-center transition-all duration-300 cursor-pointer"
                style={{
                  background: isActive ? "rgba(139,92,246,0.08)" : "rgba(255,255,255,0.015)",
                  border: `1px solid ${isActive ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.04)"}`,
                  boxShadow: isActive ? "0 0 12px rgba(139,92,246,0.1)" : "none",
                }}
              >
                <span style={{ color: isActive ? "#8B5CF6" : "rgba(255,255,255,0.3)" }}>{PRESET_ICONS[key]}</span>
                <span className="text-xs font-semibold" style={{ color: isActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)" }}>{p.label}</span>
                <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>{p.desc.split(" ").slice(0, 3).join(" ")}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sliders */}
      <Slider icon={<Timer size={14} />} label="Vertraging" value={delay} unit="s" min={15} max={60} step={5} onChange={onDelayChange} leftLabel="Snel" rightLabel="Veilig" />
      <Slider icon={<Layers size={14} />} label="Batch grootte" value={batchSize} unit="" min={3} max={10} step={1} onChange={onBatchSizeChange} leftLabel="Klein" rightLabel="Groter" />
      <Slider icon={<Pause size={14} />} label="Batch pauze" value={batchPause} unit="s" min={180} max={900} step={60} onChange={onBatchPauseChange} leftLabel="3 min" rightLabel="15 min" />
    </div>
  );
}
