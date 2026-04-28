"use client";

import { useState, useEffect, type CSSProperties } from "react";
import { Download, Share2, RotateCcw, Trophy } from "lucide-react";

interface Props {
  cancelled: number;
  skipped: number;
  failed: number;
  total: number;
  durationMs: number;
  usernames: string[];
  onReset: () => void;
}

function Confetti() {
  const colors = ["#D946EF", "#8B5CF6", "#06B6D4", "#10B981", "#f59e0b", "#ec4899"];
  const rand = (index: number, salt: number) => {
    const value = Math.sin(index * 9301 + salt * 49297) * 233280;
    return value - Math.floor(value);
  };

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 100 }}>
      {Array.from({ length: 40 }).map((_, i) => {
        const x = 10 + rand(i, 1) * 80;
        const delay = rand(i, 2) * 0.8;
        const dur = 1.5 + rand(i, 3) * 2;
        const size = 4 + rand(i, 4) * 6;
        const height = size * (0.5 + rand(i, 5));
        const spin = `${rand(i, 6) > 0.5 ? "" : "-"}${360 + rand(i, 7) * 360}deg`;
        return (
          <div
            key={i}
            className="absolute rounded-sm"
            style={{
              left: `${x}%`,
              top: "40%",
              width: size,
              height,
              background: colors[i % colors.length],
              opacity: 0,
              "--spin": spin,
              animation: `confettiFall ${dur}s ease-out ${delay}s forwards`,
            } as CSSProperties}
          />
        );
      })}
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(-200px) rotate(var(--spin)); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export function ResultsDashboard({ cancelled, skipped, failed, total, durationMs, usernames, onReset }: Props) {
  const [showConfetti, setShowConfetti] = useState(true);
  const mins = Math.round(durationMs / 60000);

  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 3500);
    return () => clearTimeout(t);
  }, []);

  const downloadCSV = () => {
    const header = "username,status\n";
    const rows = usernames.map((u) => `${u},processed`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `instaclean-resultaat-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareText = `Ik heb ${cancelled.toLocaleString()} Instagram follow requests geannuleerd met InstaClean! 🧹✨\n\nhttps://instaclean.nl`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "InstaClean Resultaat", text: shareText });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(shareText);
    }
  };

  return (
    <>
      {showConfetti && <Confetti />}
      <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(16,185,129,0.15)" }}>
        {/* Header */}
        <div className="px-6 py-8 text-center" style={{ background: "rgba(16,185,129,0.04)" }}>
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{
              background: "rgba(16,185,129,0.1)",
              boxShadow: "0 0 30px rgba(16,185,129,0.15)",
              animation: "successPop 0.6s cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            <Trophy size={28} className="text-green" />
          </div>
          <h3 className="text-xl font-bold mb-1">Klaar! 🎉</h3>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            {cancelled.toLocaleString()} van {total.toLocaleString()} follow requests geannuleerd in {mins} minuten
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-px" style={{ background: "rgba(255,255,255,0.03)" }}>
          <div className="p-4 text-center" style={{ background: "#07070D" }}>
            <div className="text-2xl font-bold text-green">{cancelled.toLocaleString()}</div>
            <p className="text-[10px] uppercase tracking-wider mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>Geannuleerd</p>
          </div>
          <div className="p-4 text-center" style={{ background: "#07070D" }}>
            <div className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.4)" }}>{skipped}</div>
            <p className="text-[10px] uppercase tracking-wider mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>Overgeslagen</p>
          </div>
          <div className="p-4 text-center" style={{ background: "#07070D" }}>
            <div className="text-2xl font-bold text-red-400">{failed}</div>
            <p className="text-[10px] uppercase tracking-wider mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>Mislukt</p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-5 flex flex-wrap gap-3">
          <button onClick={handleShare} className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium cursor-pointer transition-all duration-300 hover:-translate-y-0.5" style={{ background: "linear-gradient(135deg, #D946EF, #8B5CF6)", color: "white" }}>
            <Share2 size={15} />
            Deel resultaat
          </button>
          <button onClick={downloadCSV} className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium cursor-pointer transition-all duration-300 hover:-translate-y-0.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}>
            <Download size={15} />
            Download CSV
          </button>
          <button onClick={onReset} className="flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm cursor-pointer transition-all duration-300 hover:bg-white/[0.03]" style={{ color: "rgba(255,255,255,0.35)" }}>
            <RotateCcw size={14} />
          </button>
        </div>
      </div>
    </>
  );
}
