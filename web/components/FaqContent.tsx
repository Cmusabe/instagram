"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Reveal } from "./Reveal";

function FaqItem({ q, a, isOpen, onToggle }: { q: string; a: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-xl overflow-hidden transition-all duration-300" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderLeftWidth: "3px", borderLeftColor: isOpen ? "#D946EF" : "transparent" }}>
      <button onClick={onToggle} className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer transition-colors hover:bg-white/[0.01]" aria-expanded={isOpen}>
        <h2 className="text-sm font-semibold pr-4">{q}</h2>
        <ChevronDown size={16} className={`flex-shrink-0 transition-all duration-300 ${isOpen ? "rotate-180 text-magenta" : ""}`} style={{ color: isOpen ? "#D946EF" : "rgba(255,255,255,0.2)" }} />
      </button>
      <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: isOpen ? "200px" : "0", opacity: isOpen ? 1 : 0 }}>
        <p className="px-5 pb-4 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{a}</p>
      </div>
    </div>
  );
}

export function FaqContent({ faqs }: { faqs: { q: string; a: string }[] }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="mt-10 space-y-3">
      {faqs.map((faq, i) => (
        <Reveal key={i} delay={i * 0.04}>
          <FaqItem q={faq.q} a={faq.a} isOpen={openIndex === i} onToggle={() => setOpenIndex(openIndex === i ? -1 : i)} />
        </Reveal>
      ))}
    </div>
  );
}
