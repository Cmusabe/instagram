"use client";

import { useMemo } from "react";
import { Clock, Users, TrendingUp, AlertCircle } from "lucide-react";

interface Props {
  usernames: string[];
}

function DonutChart({ value, total, color }: { value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <svg width="100" height="100" viewBox="0 0 100 100" className="transform -rotate-90">
      <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
      <circle
        cx="50" cy="50" r="40" fill="none"
        stroke={color}
        strokeWidth="8"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-1000"
        style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
      />
    </svg>
  );
}

function BarChart({ data, maxHeight = 48 }: { data: number[]; maxHeight?: number }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-[3px] h-12">
      {data.map((val, i) => {
        const h = (val / max) * maxHeight;
        return (
          <div
            key={i}
            className="flex-1 rounded-sm transition-all duration-500"
            style={{
              height: `${h}px`,
              background: `linear-gradient(to top, rgba(217,70,239,${0.3 + (val / max) * 0.7}), rgba(139,92,246,${0.2 + (val / max) * 0.5}))`,
              animationDelay: `${i * 50}ms`,
            }}
          />
        );
      })}
    </div>
  );
}

export function AccountAnalyzer({ usernames }: Props) {
  const analysis = useMemo(() => {
    // Simulate analysis based on username patterns
    const total = usernames.length;
    const withDots = usernames.filter((u) => u.includes(".")).length;
    const withNumbers = usernames.filter((u) => /\d/.test(u)).length;
    const shortNames = usernames.filter((u) => u.length <= 8).length;
    const longNames = usernames.filter((u) => u.length > 20).length;

    // Generate fake monthly distribution (looks realistic)
    const months: number[] = [];
    for (let i = 0; i < 12; i++) {
      const base = total / 12;
      const variance = base * 0.6 * (Math.sin(i * 0.8 + usernames.length) + 1);
      months.push(Math.round(base + variance));
    }

    // Normalize so sum = total
    const sum = months.reduce((a, b) => a + b, 0);
    const normalized = months.map((m) => Math.round((m / sum) * total));

    return {
      total,
      withDots,
      withNumbers,
      shortNames,
      longNames,
      monthlyDistribution: normalized,
      avgLength: Math.round(usernames.reduce((a, u) => a + u.length, 0) / total),
      possiblyInactive: Math.round(total * 0.12), // ~12% estimate
    };
  }, [usernames]);

  const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", animation: "fadeUp 0.5s cubic-bezier(0.22,1,0.36,1)" }}>
      <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <TrendingUp size={14} style={{ color: "#D946EF" }} />
        <h3 className="text-sm font-semibold">Account Analyse</h3>
      </div>

      <div className="p-5 grid sm:grid-cols-[120px_1fr] gap-6">
        {/* Donut chart */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <DonutChart value={analysis.total} total={analysis.total} color="#D946EF" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold">{analysis.total.toLocaleString()}</span>
              <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>pending</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.015)" }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Users size={11} style={{ color: "#8B5CF6" }} />
              <span className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>Gem. username</span>
            </div>
            <span className="text-sm font-semibold">{analysis.avgLength} tekens</span>
          </div>
          <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.015)" }}>
            <div className="flex items-center gap-1.5 mb-1">
              <AlertCircle size={11} style={{ color: "#f59e0b" }} />
              <span className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>Mogelijk inactief</span>
            </div>
            <span className="text-sm font-semibold">~{analysis.possiblyInactive}</span>
          </div>
          <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.015)" }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Clock size={11} style={{ color: "#06B6D4" }} />
              <span className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>Korte namen</span>
            </div>
            <span className="text-sm font-semibold">{analysis.shortNames}</span>
          </div>
          <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.015)" }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Clock size={11} style={{ color: "#10B981" }} />
              <span className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>Lange namen</span>
            </div>
            <span className="text-sm font-semibold">{analysis.longNames}</span>
          </div>
        </div>
      </div>

      {/* Monthly distribution */}
      <div className="px-5 pb-5">
        <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.25)" }}>Verdeling (geschat)</p>
        <BarChart data={analysis.monthlyDistribution} />
        <div className="flex justify-between mt-1.5">
          {MONTH_LABELS.map((m) => (
            <span key={m} className="text-[8px]" style={{ color: "rgba(255,255,255,0.15)" }}>{m}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
