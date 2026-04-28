"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Reveal } from "./Reveal";
import { trackSubscribe } from "@/lib/track";

const PLATFORMS = [
  { name: "TikTok", desc_nl: "Follow Cleanup", desc_en: "Follow Cleanup", color: "#ff0050", status_nl: "In ontwikkeling", status_en: "In development", progress: 65 },
  { name: "Twitter/X", desc_nl: "Mass Unfollow", desc_en: "Mass Unfollow", color: "#1DA1F2", status_nl: "Gepland Q3", status_en: "Planned Q3", progress: 20 },
  { name: "LinkedIn", desc_nl: "Connection Cleanup", desc_en: "Connection Cleanup", color: "#0A66C2", status_nl: "Gepland Q4", status_en: "Planned Q4", progress: 5 },
];

export function ComingSoon() {
  const pathname = usePathname();
  const isEN = pathname.startsWith("/en");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <section className="max-w-[1000px] mx-auto px-6 py-24 sm:py-32">
      <Reveal>
        <p className="text-center text-[11px] font-medium uppercase tracking-[0.2em] mb-3" style={{ color: "rgba(139,92,246,0.6)" }}>
          {isEN ? "Coming soon" : "Binnenkort"}
        </p>
        <h2 className="text-center" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
          {isEN ? "Not just Instagram." : "Niet alleen Instagram."}
        </h2>
        <p className="text-center mt-3 text-[1rem]" style={{ color: "rgba(255,255,255,0.35)" }}>
          {isEN ? "InstaClean is becoming a platform for all your social media cleanup." : "InstaClean wordt een platform voor al je social media cleanup."}
        </p>
      </Reveal>

      <Reveal delay={0.15}>
        <div className="mt-12 grid sm:grid-cols-3 gap-4">
          {PLATFORMS.map((p) => (
            <div key={p.name} className="rounded-2xl p-6 transition-all duration-500 hover:-translate-y-1 cursor-default" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: `${p.color}20`, color: p.color }}>{p.name[0]}</div>
                <div>
                  <p className="text-sm font-semibold">{p.name}</p>
                  <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{isEN ? p.desc_en : p.desc_nl}</p>
                </div>
              </div>
              <div className="h-1 rounded-full overflow-hidden mb-2" style={{ background: "rgba(255,255,255,0.04)" }}>
                <div className="h-full rounded-full" style={{ width: `${p.progress}%`, background: p.color, opacity: 0.6 }} />
              </div>
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>{isEN ? p.status_en : p.status_nl}</p>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.25}>
        <div className="mt-10 max-w-md mx-auto">
          {submitted ? (
            <div className="text-center py-4 rounded-xl" style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.1)" }}>
              <p className="text-sm font-medium" style={{ color: "#10B981" }}>{"\u2713"} {isEN ? "You\u2019ll be the first to know!" : "Je wordt als eerste ge\u00EFnformeerd!"}</p>
            </div>
          ) : (
            <div className="flex gap-2">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="je@email.com" aria-label={isEN ? "Email address" : "E-mailadres"} className="flex-1 rounded-xl px-4 py-3 text-sm outline-none transition-all duration-300" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.8)" }} />
              <button onClick={() => { if (email.includes("@")) { setSubmitted(true); trackSubscribe(email); } }} className="rounded-xl px-5 py-3 text-sm font-semibold text-white cursor-pointer transition-all duration-300 hover:-translate-y-0.5" style={{ background: "linear-gradient(135deg, #D946EF, #8B5CF6)", boxShadow: "0 0 12px rgba(217,70,239,0.2)" }}>
                {isEN ? "Notify me" : "Notify me"}
              </button>
            </div>
          )}
          <p className="text-center text-[10px] mt-3" style={{ color: "rgba(255,255,255,0.15)" }}>
            {isEN ? "No spam. Just a notification when it goes live." : "Geen spam. Alleen een melding als het live gaat."}
          </p>
        </div>
      </Reveal>
    </section>
  );
}
