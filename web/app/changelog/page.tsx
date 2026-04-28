import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/Reveal";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog — InstaClean",
  description: "Alle updates en verbeteringen aan InstaClean.",
};

const CHANGELOG = [
  {
    version: "3.0",
    date: "April 2026",
    tag: "Nieuw",
    color: "#D946EF",
    changes: [
      "Live voortgang dashboard — zie real-time welke accounts worden verwerkt",
      "Automatische rate-limit detectie — script pauzeert en hervat zichzelf",
      "Sessie-herstel — hervat waar je was na een onderbreking",
      "Input validatie — ongeldige usernames worden vooraf gedetecteerd",
      "Configuratie presets — Veilig, Gebalanceerd, of Snel met \u00e9\u00e9n klik",
      "Resultaten dashboard met CSV export en deel-functie",
      "Transparantie pagina — exact uitleg van wat het script doet",
      "Dynamische OG images voor social sharing",
    ],
  },
  {
    version: "2.0",
    date: "Maart 2026",
    tag: "Update",
    color: "#8B5CF6",
    changes: [
      "Volledige website redesign met premium dark theme",
      "Framer Motion scroll animaties",
      "Geanimeerde hero product demo",
      "Interactieve 3-stappen flow met live previews",
      "Testimonial marquee met glassmorphism cards",
      "JSON + TXT bestandsondersteuning naast HTML",
    ],
  },
  {
    version: "1.0",
    date: "Februari 2026",
    tag: "Launch",
    color: "#06B6D4",
    changes: [
      "Eerste release van InstaClean",
      "Instagram HTML export parsing",
      "Script generatie met configureerbare delays",
      "Progress tracking via localStorage",
      "Browser console uitvoering",
    ],
  },
];

export default function Changelog() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-[700px] mx-auto px-6 pt-40 pb-20">
        <Reveal>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 600, letterSpacing: "-0.03em" }}>
            Changelog
          </h1>
          <p className="mt-2 text-[1rem]" style={{ color: "rgba(255,255,255,0.4)" }}>
            Alle updates en verbeteringen.
          </p>
        </Reveal>

        <div className="mt-12 relative">
          {/* Timeline line */}
          <div className="absolute left-[7px] top-6 bottom-6 w-px" style={{ background: "linear-gradient(to bottom, rgba(217,70,239,0.2), rgba(139,92,246,0.1), transparent)" }} />

          <div className="space-y-12">
            {CHANGELOG.map((release, i) => (
              <Reveal key={release.version} delay={i * 0.1}>
                <div className="relative pl-8">
                  {/* Dot */}
                  <div className="absolute left-0 top-1.5 w-[15px] h-[15px] rounded-full" style={{ background: "#07070D", border: `2px solid ${release.color}`, boxShadow: `0 0 8px ${release.color}30` }} />

                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-lg font-bold">v{release.version}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${release.color}15`, color: release.color }}>
                      {release.tag}
                    </span>
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>{release.date}</span>
                  </div>

                  <ul className="space-y-1.5">
                    {release.changes.map((change) => (
                      <li key={change} className="flex items-start gap-2 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                        <span style={{ color: release.color }} className="mt-1 flex-shrink-0">&#8226;</span>
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
