import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/Reveal";
import { Check, AlertTriangle, FileText, Code2, Globe, Sparkles } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works \u2014 InstaClean",
  description: "A complete explanation of how InstaClean works and why it\u2019s safe.",
};

export default function HowItWorksEN() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-[800px] mx-auto px-6 pt-40 pb-20 space-y-12">
        <Reveal>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 600, letterSpacing: "-0.03em" }}>How does InstaClean work?</h1>
          <p className="mt-2 text-[1rem]" style={{ color: "rgba(255,255,255,0.4)" }}>A complete explanation of what it does, how it works, and why it&apos;s safe.</p>
        </Reveal>

        <Reveal>
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">What does it do?</h2>
            <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                If you&apos;ve followed a lot of people on Instagram, you probably have hundreds or thousands of <strong className="text-white/80">pending follow requests</strong> open. These are requests to private accounts that haven&apos;t been accepted yet. InstaClean helps you cancel all of them at once.
              </p>
            </div>
          </section>
        </Reveal>

        <Reveal delay={0.1}>
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">How does it work technically?</h2>
            <div className="relative space-y-0">
              <div className="absolute left-[18px] top-6 bottom-6 w-px" style={{ background: "linear-gradient(to bottom, #D946EF, #8B5CF6, #06B6D4)" }} />
              {[
                { n: "1", icon: <FileText size={18} />, title: "Upload data export", content: "You download your data from Instagram (Settings > Your Activity > Download Your Information). This export contains an HTML file with all your pending follow requests." },
                { n: "2", icon: <Code2 size={18} />, title: "Generate script", content: "Based on your usernames and settings, we generate a JavaScript script that contains the list of accounts and the logic to cancel them via Instagram\u2019s own API." },
                { n: "3", icon: <Globe size={18} />, title: "Run in your browser", content: "You open instagram.com, open the Developer Console (F12), and paste the script. It makes the same API calls Instagram uses when you manually click \u2018Unfollow\u2019." },
                { n: "4", icon: <Sparkles size={18} />, title: "Automatic processing", content: "The script processes all accounts with built-in pauses to prevent rate limiting. Progress is saved locally so you can stop and resume later." },
              ].map((step) => (
                <div key={step.n} className="relative flex gap-3 py-3">
                  <div className="relative z-10 flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "linear-gradient(135deg, #D946EF, #8B5CF6)", boxShadow: "0 0 12px rgba(217,70,239,0.2)" }}>{step.n}</div>
                  <div className="rounded-xl p-5 flex-1" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span style={{ color: "#D946EF" }}>{step.icon}</span>
                      <h3 className="text-sm font-semibold">{step.title}</h3>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>{step.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        <Reveal delay={0.15}>
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Is it safe?</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { title: "No password needed", desc: "The script uses your existing session." },
                { title: "100% local", desc: "Nothing is sent to external servers." },
                { title: "Open source", desc: "You can fully inspect the script." },
              ].map((item) => (
                <div key={item.title} className="rounded-xl p-4 flex gap-3 transition-all duration-300 hover:-translate-y-0.5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(16,185,129,0.1)" }}><Check size={14} className="text-green" /></div>
                  <div><p className="text-xs font-semibold">{item.title}</p><p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{item.desc}</p></div>
                </div>
              ))}
              <div className="rounded-xl p-4 flex gap-3" style={{ background: "rgba(245,158,11,0.03)", border: "1px solid rgba(245,158,11,0.08)" }}>
                <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(245,158,11,0.1)" }}><AlertTriangle size={14} className="text-amber-400" /></div>
                <div><p className="text-xs font-semibold">Risk</p><p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Instagram may apply rate limiting.</p></div>
              </div>
            </div>
          </section>
        </Reveal>

        <div className="text-center pt-4">
          <a href="/en/tool" className="inline-flex items-center gap-2 rounded-xl px-8 py-4 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5" style={{ background: "linear-gradient(135deg, #D946EF, #8B5CF6)", boxShadow: "0 0 16px rgba(217,70,239,0.2)" }}>
            Go to tool
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}
