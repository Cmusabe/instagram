"use client";

import { useState, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Reveal, FadeIn } from "@/components/Reveal";
import { ArrowRight, Clock, Mail, HelpCircle, CheckCircle, Loader2, Send, Sparkles, MessageCircle, Zap } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const SUBJECTS = [
  { value: "question", label: "Vraag", icon: <MessageCircle size={12} /> },
  { value: "bug", label: "Bug", icon: <Zap size={12} /> },
  { value: "feature", label: "Feature", icon: <Sparkles size={12} /> },
  { value: "collab", label: "Samenwerking", icon: <ArrowRight size={12} /> },
  { value: "other", label: "Anders", icon: <Mail size={12} /> },
];

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "question", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [focused, setFocused] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Er ging iets mis");
      }
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Er ging iets mis.");
    }
  };

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const inputClasses = "w-full rounded-xl px-4 py-3.5 text-sm outline-none transition-all duration-500";

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute top-[15%] right-[20%] w-[400px] h-[400px] rounded-full opacity-[0.04]" style={{ background: "radial-gradient(circle, #D946EF, transparent 70%)", filter: "blur(100px)", animation: "float1 20s ease-in-out infinite" }} />
        <div className="absolute bottom-[20%] left-[10%] w-[300px] h-[300px] rounded-full opacity-[0.03]" style={{ background: "radial-gradient(circle, #8B5CF6, transparent 70%)", filter: "blur(80px)", animation: "float2 16s ease-in-out infinite" }} />
      </div>

      <main className="relative max-w-[1100px] mx-auto px-6 pt-[140px] sm:pt-[180px] pb-24" style={{ zIndex: 1 }}>
        {/* Hero */}
        <div className="max-w-[600px] mb-20">
          <FadeIn>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-[6px] h-[6px] rounded-full" style={{ background: "#8B5CF6", boxShadow: "0 0 6px #8B5CF6, 0 0 12px rgba(139,92,246,0.3)" }} />
              <span className="text-[11px] font-medium uppercase tracking-[0.15em]" style={{ color: "rgba(139,92,246,0.5)" }}>Contact</span>
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 style={{ fontSize: "clamp(2.8rem, 7vw, 5rem)", fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1.05 }}>
              <span style={{ color: "rgba(255,255,255,0.55)" }}>Laten we</span>
              <br />
              <span className="text-grad">praten.</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="mt-6 text-[1.05rem] leading-[1.7]" style={{ color: "rgba(255,255,255,0.3)", maxWidth: 420 }}>
              Vraag, idee, bug, of gewoon even hoi zeggen. We horen het graag en reageren meestal binnen 24 uur.
            </p>
          </FadeIn>
        </div>

        {/* Two column */}
        <div className="grid lg:grid-cols-[1fr_320px] gap-8 lg:gap-16 items-start">
          {/* Form */}
          <Reveal>
            <div className="relative rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.05)" }}>
              {/* Top accent line */}
              <div className="h-[2px]" style={{ background: "linear-gradient(90deg, transparent 5%, #D946EF 30%, #8B5CF6 60%, #06B6D4 80%, transparent 95%)", opacity: 0.5 }} />

              {status === "success" ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="px-8 py-24 text-center"
                >
                  <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: "rgba(16,185,129,0.06)", boxShadow: "0 0 40px rgba(16,185,129,0.08)" }}>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
                    >
                      <CheckCircle size={32} style={{ color: "#10B981" }} />
                    </motion.div>
                  </div>
                  <h2 className="text-2xl font-semibold mb-2">Verstuurd!</h2>
                  <p className="text-[15px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                    Bedankt. We reageren zo snel mogelijk.
                  </p>
                  <button
                    onClick={() => { setStatus("idle"); setForm({ name: "", email: "", subject: "question", message: "" }); }}
                    className="mt-8 text-xs cursor-pointer transition-colors hover:text-white/40"
                    style={{ color: "rgba(255,255,255,0.15)" }}
                  >
                    Nog een bericht sturen &rarr;
                  </button>
                </motion.div>
              ) : (
                <form ref={formRef} onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
                  {/* Name + Email */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      { id: "name", label: "Naam", type: "text", placeholder: "Je naam", value: form.name },
                      { id: "email", label: "E-mail", type: "email", placeholder: "je@email.com", value: form.email },
                    ].map((field) => (
                      <div key={field.id}>
                        <label htmlFor={field.id} className="block text-[10px] font-medium uppercase tracking-[0.15em] mb-2" style={{ color: "rgba(255,255,255,0.25)" }}>{field.label}</label>
                        <input
                          id={field.id}
                          type={field.type}
                          required
                          value={field.value}
                          onChange={(e) => update(field.id, e.target.value)}
                          onFocus={() => setFocused(field.id)}
                          onBlur={() => setFocused(null)}
                          placeholder={field.placeholder}
                          className={inputClasses}
                          style={{
                            background: focused === field.id ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.015)",
                            border: `1px solid ${focused === field.id ? "rgba(139,92,246,0.25)" : "rgba(255,255,255,0.04)"}`,
                            color: "rgba(255,255,255,0.85)",
                            boxShadow: focused === field.id ? "0 0 24px rgba(139,92,246,0.05), inset 0 1px 0 rgba(255,255,255,0.02)" : "none",
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Subject pills */}
                  <div>
                    <label className="block text-[10px] font-medium uppercase tracking-[0.15em] mb-3" style={{ color: "rgba(255,255,255,0.25)" }}>Onderwerp</label>
                    <div className="flex flex-wrap gap-2">
                      {SUBJECTS.map((s) => {
                        const active = form.subject === s.value;
                        return (
                          <button
                            key={s.value}
                            type="button"
                            onClick={() => update("subject", s.value)}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-medium cursor-pointer transition-all duration-400"
                            style={{
                              background: active ? "rgba(139,92,246,0.1)" : "rgba(255,255,255,0.015)",
                              border: `1px solid ${active ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.04)"}`,
                              color: active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.3)",
                              boxShadow: active ? "0 0 16px rgba(139,92,246,0.06)" : "none",
                              transform: active ? "scale(1.02)" : "scale(1)",
                            }}
                          >
                            <span style={{ color: active ? "#8B5CF6" : "rgba(255,255,255,0.15)" }}>{s.icon}</span>
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="message" className="block text-[10px] font-medium uppercase tracking-[0.15em] mb-2" style={{ color: "rgba(255,255,255,0.25)" }}>Bericht</label>
                    <textarea
                      id="message"
                      required
                      rows={6}
                      value={form.message}
                      onChange={(e) => update("message", e.target.value)}
                      onFocus={() => setFocused("message")}
                      onBlur={() => setFocused(null)}
                      placeholder="Waar kunnen we je mee helpen?"
                      className={`${inputClasses} resize-none`}
                      style={{
                        background: focused === "message" ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.015)",
                        border: `1px solid ${focused === "message" ? "rgba(139,92,246,0.25)" : "rgba(255,255,255,0.04)"}`,
                        color: "rgba(255,255,255,0.85)",
                        boxShadow: focused === "message" ? "0 0 24px rgba(139,92,246,0.05)" : "none",
                      }}
                    />
                  </div>

                  {status === "error" && (
                    <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.1)", color: "#f87171" }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                      {errorMsg}
                    </div>
                  )}

                  {/* Submit row */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="submit"
                      disabled={status === "loading"}
                      className="group flex items-center gap-2.5 rounded-xl px-7 py-3.5 text-sm font-semibold text-white cursor-pointer transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: "linear-gradient(135deg, #D946EF, #8B5CF6)",
                        boxShadow: "0 0 24px rgba(217,70,239,0.2), 0 4px 12px rgba(0,0,0,0.2)",
                      }}
                    >
                      {status === "loading" ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Send size={14} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      )}
                      {status === "loading" ? "Verzenden..." : "Verstuur bericht"}
                    </button>
                    <span className="hidden sm:block text-[9px] tracking-wide" style={{ color: "rgba(255,255,255,0.1)" }}>
                      Nooit gedeeld met derden
                    </span>
                  </div>
                </form>
              )}
            </div>
          </Reveal>

          {/* Sidebar */}
          <div className="space-y-4 lg:sticky lg:top-32">
            <Reveal delay={0.1}>
              <div className="rounded-2xl p-5 transition-all duration-500 hover:border-[rgba(255,255,255,0.08)]" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(6,182,212,0.06)", color: "#06B6D4" }}>
                    <Clock size={17} />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold">Responstijd</p>
                    <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>Meestal binnen 24 uur</p>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.15}>
              <a href="mailto:info@webdesignbyou.nl" className="block rounded-2xl p-5 group transition-all duration-500 hover:border-[rgba(217,70,239,0.12)]" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(217,70,239,0.06)", color: "#D946EF" }}>
                    <Mail size={17} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold">Direct mailen</p>
                    <p className="text-[11px] font-mono truncate" style={{ color: "rgba(255,255,255,0.25)" }}>info@webdesignbyou.nl</p>
                  </div>
                  <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" style={{ color: "rgba(255,255,255,0.1)" }} />
                </div>
              </a>
            </Reveal>

            <Reveal delay={0.2}>
              <Link href="/faq" className="block rounded-2xl p-5 group transition-all duration-500 hover:border-[rgba(16,185,129,0.12)]" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(16,185,129,0.06)", color: "#10B981" }}>
                    <HelpCircle size={17} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold">FAQ bekijken</p>
                    <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>Antwoord staat er misschien al</p>
                  </div>
                  <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" style={{ color: "rgba(255,255,255,0.1)" }} />
                </div>
              </Link>
            </Reveal>

            {/* Quote */}
            <Reveal delay={0.25}>
              <div className="rounded-xl p-5 relative overflow-hidden" style={{ background: "rgba(139,92,246,0.02)", border: "1px solid rgba(139,92,246,0.05)" }}>
                <div className="absolute top-2 left-3 text-[2.5rem] font-serif leading-none select-none" style={{ color: "rgba(139,92,246,0.06)" }}>&ldquo;</div>
                <p className="relative text-[12px] leading-relaxed italic" style={{ color: "rgba(255,255,255,0.25)" }}>
                  Feature idee? Bug gevonden? We bouwen InstaClean samen met onze community. Jouw input maakt het beter.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ background: "linear-gradient(135deg, #D946EF, #8B5CF6)" }}>IC</div>
                  <span className="text-[10px] font-medium" style={{ color: "rgba(255,255,255,0.2)" }}>Team InstaClean</span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
