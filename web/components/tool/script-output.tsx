"use client";

import { useState } from "react";
import { Copy, Check, Sparkles } from "lucide-react";
import { useToast } from "@/components/Toast";

interface Props {
  script: string;
  onCopied?: () => void;
}

export function ScriptOutput({ script, onCopied }: Props) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(script);
    setCopied(true);
    toast("Script gekopieerd naar klembord!", "success");
    if (onCopied) onCopied();
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-4" style={{ animation: "scaleIn 0.4s cubic-bezier(0.22,1,0.36,1)" }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} style={{ color: "#D946EF" }} />
          <h3 className="text-sm font-semibold">Script gegenereerd</h3>
        </div>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
          style={{
            background: copied
              ? "#10b981"
              : "linear-gradient(135deg, #D946EF, #8B5CF6)",
            boxShadow: copied
              ? "0 0 16px rgba(16,185,129,0.3)"
              : "0 0 12px rgba(217,70,239,0.25)",
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Gekopieerd!" : "Kopieer script"}
        </button>
      </div>

      <div className="relative rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 8px 30px rgba(0,0,0,0.3)" }}>
        {/* Terminal header */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06]" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          </div>
          <span className="ml-2 text-[10px] text-white/25 font-mono">console &mdash; instagram.com</span>
        </div>
        {/* Code with fade at bottom */}
        <div className="relative">
          <pre className="p-4 text-[11px] text-emerald-400/90 font-mono overflow-x-auto max-h-56 overflow-y-auto leading-relaxed" style={{ background: "#0c0c14" }}>
            {script.slice(0, 1200)}
            {script.length > 1200 && (
              <span className="text-white/15">
                {"\n"}... +{Math.round((script.length - 1200) / 1024)}KB meer
              </span>
            )}
          </pre>
          {/* Fade overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none" style={{ background: "linear-gradient(to top, #0c0c14, transparent)" }} />
        </div>
      </div>
    </div>
  );
}
