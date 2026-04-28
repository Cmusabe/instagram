import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Check, AlertTriangle, FileText, Code2, Globe, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

const techSteps: { n: string; title: string; content: string; icon: ReactNode }[] = [
  { n: "1", title: "Data export uploaden", content: "Je downloadt je data van Instagram (Instellingen > Je activiteit > Je informatie downloaden). In die export zit een HTML-bestand met al je pending follow requests. InstaClean leest dit bestand en extraheert alle usernames.", icon: <FileText size={20} /> },
  { n: "2", title: "Script genereren", content: "Op basis van je usernames en instellingen genereren we een JavaScript-script. Dit script bevat de lijst van accounts en de logica om ze te annuleren via Instagram\u2019s eigen API.", icon: <Code2 size={20} /> },
  { n: "3", title: "In je browser uitvoeren", content: "Je opent instagram.com, opent de Developer Console (F12), en plakt het script. Het script maakt dezelfde API-calls die Instagram zelf ook maakt als je handmatig op \u2018Unfollow\u2019 klikt.", icon: <Globe size={20} /> },
  { n: "4", title: "Automatisch verwerken", content: "Het script verwerkt alle accounts met ingebouwde pauzes om rate limiting te voorkomen. Progress wordt lokaal opgeslagen, zodat je kunt stoppen en later verder kunt gaan.", icon: <Sparkles size={20} /> },
];

export default function HowItWorks() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-8 space-y-10">
        <div style={{ animation: "fadeInDown 0.5s ease-out both" }}>
          <h1 className="text-3xl sm:text-4xl font-bold text-text">Hoe werkt InstaClean?</h1>
          <p className="text-text-secondary mt-2 leading-relaxed">Een complete uitleg van wat het doet, hoe het werkt, en waarom het veilig is.</p>
        </div>

        {/* What */}
        <section className="space-y-4" style={{ animation: "fadeInUp 0.6s ease-out 0.2s both" }}>
          <h2 className="text-xl font-bold text-text">Wat doet het?</h2>
          <div className="rounded-2xl glass-card p-6 space-y-3">
            <p className="text-sm text-text-secondary leading-relaxed">
              Als je veel mensen hebt gevolgd op Instagram, staan er waarschijnlijk honderden of duizenden <strong className="text-text">pending follow requests</strong> open. Dat zijn verzoeken naar priv&eacute;-accounts die nog niet geaccepteerd zijn.
            </p>
            <p className="text-sm text-text-secondary leading-relaxed">
              InstaClean helpt je om al deze verzoeken in &eacute;&eacute;n keer te annuleren, in plaats van handmatig &eacute;&eacute;n voor &eacute;&eacute;n.
            </p>
          </div>
        </section>

        {/* How — Timeline */}
        <ScrollReveal>
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-text">Hoe werkt het technisch?</h2>
            <div className="relative space-y-0">
              {/* Vertical line */}
              <div className="absolute left-[18px] top-6 bottom-6 w-px" style={{ background: "linear-gradient(to bottom, #e1306c, #833ab4, #6366f1)" }} aria-hidden="true" />

              {techSteps.map((step, i) => (
                <ScrollReveal key={step.n} delay={i * 100}>
                  <div className="relative flex gap-3 py-3">
                    {/* Number circle */}
                    <div className="relative z-10 flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "linear-gradient(135deg, #e1306c, #833ab4)", boxShadow: "0 0 15px rgba(225,48,108,0.3)" }}>
                      {step.n}
                    </div>
                    {/* Content */}
                    <div className="glass-card rounded-xl p-5 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-primary">{step.icon}</span>
                        <h3 className="text-sm font-semibold text-text">{step.title}</h3>
                      </div>
                      <p className="text-sm text-text-secondary leading-relaxed">{step.content}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </section>
        </ScrollReveal>

        {/* Safety */}
        <ScrollReveal>
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-text">Is het veilig?</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { title: "Geen wachtwoord nodig", desc: "Het script gebruikt je bestaande sessie." },
                { title: "100% lokaal", desc: "Er wordt niks naar externe servers gestuurd." },
                { title: "Open source", desc: "Je kunt het script volledig inzien." },
              ].map((item) => (
                <div key={item.title} className="glass-card rounded-xl p-4 flex gap-3 hover-lift cursor-default">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-success/15 flex items-center justify-center">
                    <Check size={14} className="text-success" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text">{item.title}</p>
                    <p className="text-[11px] text-text-secondary mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
              <div className="glass-card rounded-xl p-4 flex gap-3 hover-lift cursor-default">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-warning/15 flex items-center justify-center">
                  <AlertTriangle size={14} className="text-warning" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-text">Risico</p>
                  <p className="text-[11px] text-text-secondary mt-0.5">Instagram kan rate limiting toepassen.</p>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* Export guide */}
        <ScrollReveal>
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-text">Hoe download ik mijn Instagram data?</h2>
            <div className="relative space-y-0">
              <div className="absolute left-[14px] top-4 bottom-4 w-px bg-border" aria-hidden="true" />
              {[
                "Open Instagram > Instellingen > Accounts Center",
                "Ga naar \"Je informatie en machtigingen\" > \"Je informatie downloaden\"",
                "Selecteer \"Een deel van je informatie\" > \"Volgers en volgend\"",
                "Kies formaat HTML en dien het verzoek in",
                "Download het ZIP-bestand wanneer het klaar is",
                "Pak het uit en zoek pending_follow_requests.html",
              ].map((text, i) => (
                <div key={i} className="relative flex gap-4 py-2">
                  <div className="relative z-10 flex-shrink-0 w-7 h-7 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-[10px] font-bold text-primary">{i + 1}</div>
                  <p className="text-sm text-text-secondary leading-relaxed pt-1">{text}</p>
                </div>
              ))}
            </div>
          </section>
        </ScrollReveal>

        <div className="text-center pt-4">
          <Link href="/tool" className="shimmer-btn inline-flex items-center justify-center rounded-xl px-8 py-4 text-base font-semibold text-white transition-all duration-300 hover:-translate-y-[3px] hover:scale-[1.02]" style={{ background: "linear-gradient(135deg, #e1306c, #833ab4)", boxShadow: "0 8px 20px rgba(225,48,108,0.3)" }}>
            Ga naar de tool
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
