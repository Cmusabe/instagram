"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, Wrench, FileText, HelpCircle, Shield, History, Home } from "lucide-react";
import type { ReactNode } from "react";

interface Command {
  id: string;
  label: string;
  desc: string;
  icon: ReactNode;
  action: () => void;
  keywords: string[];
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const commands: Command[] = [
    { id: "home", label: "Home", desc: "Ga naar de homepage", icon: <Home size={15} />, action: () => router.push("/"), keywords: ["home", "thuis", "begin"] },
    { id: "tool", label: "Start Tool", desc: "Open de annulering tool", icon: <Wrench size={15} />, action: () => router.push("/tool"), keywords: ["tool", "start", "annuleren", "begin"] },
    { id: "how", label: "Hoe het werkt", desc: "Stap-voor-stap uitleg", icon: <FileText size={15} />, action: () => router.push("/how-it-works"), keywords: ["hoe", "werkt", "uitleg", "stappen"] },
    { id: "faq", label: "FAQ", desc: "Veelgestelde vragen", icon: <HelpCircle size={15} />, action: () => router.push("/faq"), keywords: ["faq", "vragen", "help"] },
    { id: "trans", label: "Transparantie", desc: "Veiligheid en privacy", icon: <Shield size={15} />, action: () => router.push("/transparantie"), keywords: ["transparantie", "veilig", "privacy", "data"] },
    { id: "changelog", label: "Changelog", desc: "Updates en versies", icon: <History size={15} />, action: () => router.push("/changelog"), keywords: ["changelog", "updates", "versie", "nieuw"] },
    { id: "contact", label: "Contact", desc: "Neem contact op", icon: <HelpCircle size={15} />, action: () => router.push("/contact"), keywords: ["contact", "mail", "help", "vraag"] },
  ];

  const filtered = query
    ? commands.filter((c) => {
        const q = query.toLowerCase();
        return c.label.toLowerCase().includes(q) || c.keywords.some((k) => k.includes(q));
      })
    : commands;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
        setQuery("");
        setSelected(0);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && filtered[selected]) {
      filtered[selected].action();
      setOpen(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[20vh]" onClick={() => setOpen(false)}>
      {/* Backdrop */}
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }} />

      {/* Palette */}
      <div
        className="relative w-full max-w-[520px] mx-4 rounded-2xl overflow-hidden"
        style={{
          background: "rgba(15,15,25,0.95)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03) inset",
          animation: "fadeUp 0.2s cubic-bezier(0.22,1,0.36,1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <Search size={16} style={{ color: "rgba(255,255,255,0.25)" }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Zoek of navigeer..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "rgba(255,255,255,0.85)" }}
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.2)" }}>ESC</kbd>
        </div>

        {/* Results */}
        <div className="py-2 max-h-[300px] overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-5 py-4 text-sm text-center" style={{ color: "rgba(255,255,255,0.2)" }}>Geen resultaten</p>
          ) : (
            filtered.map((cmd, i) => (
              <button
                key={cmd.id}
                onClick={() => { cmd.action(); setOpen(false); }}
                onMouseEnter={() => setSelected(i)}
                className="w-full flex items-center gap-3 px-5 py-3 text-left cursor-pointer transition-colors"
                style={{
                  background: i === selected ? "rgba(255,255,255,0.04)" : "transparent",
                  color: i === selected ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)",
                }}
              >
                <span style={{ color: i === selected ? "#D946EF" : "rgba(255,255,255,0.2)" }}>{cmd.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{cmd.label}</p>
                  <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>{cmd.desc}</p>
                </div>
                {i === selected && <ArrowRight size={14} style={{ color: "rgba(255,255,255,0.2)" }} />}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 flex items-center gap-4 text-[10px]" style={{ borderTop: "1px solid rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.15)" }}>
          <span><kbd className="font-mono">↑↓</kbd> navigeer</span>
          <span><kbd className="font-mono">↵</kbd> open</span>
          <span><kbd className="font-mono">esc</kbd> sluiten</span>
        </div>
      </div>
    </div>
  );
}
