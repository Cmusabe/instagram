import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/Reveal";
import { Shield, Eye, Code2, Server, Lock, Globe } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transparantie — InstaClean",
  description: "Exact hoe InstaClean werkt, welke data het gebruikt, en waarom het veilig is.",
};

export default function Transparantie() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-[800px] mx-auto px-6 pt-40 pb-20">
        <Reveal>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(16,185,129,0.08)", color: "#10B981" }}>
              <Shield size={20} />
            </div>
            <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 600, letterSpacing: "-0.03em" }}>
              Transparantie
            </h1>
          </div>
          <p className="text-[1.05rem] leading-relaxed" style={{ color: "rgba(255,255,255,0.4)", maxWidth: 560 }}>
            Wij geloven dat je precies moet weten wat een tool doet voordat je het gebruikt. Hier is alles, zonder bullshit.
          </p>
        </Reveal>

        <div className="mt-16 space-y-8">
          {/* What we access */}
          <Reveal delay={0.1}>
            <div className="rounded-2xl p-7" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="flex items-center gap-2 mb-4">
                <Eye size={16} style={{ color: "#D946EF" }} />
                <h2 className="text-lg font-semibold">Wat het script doet</h2>
              </div>
              <div className="space-y-3 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                <p>Het InstaClean script draait <strong className="text-white/80">volledig in jouw browser</strong>. Het maakt twee soorten API calls naar Instagram:</p>
                <div className="rounded-xl p-4 font-mono text-xs space-y-2" style={{ background: "rgba(0,0,0,0.3)" }}>
                  <p className="text-cyan"><span className="text-white/30">GET</span> /api/v1/users/web_profile_info/?username=...</p>
                  <p style={{ color: "rgba(255,255,255,0.2)" }}>↳ Haalt het user ID en de actuele request-status op voor een username</p>
                  <p className="text-cyan mt-2"><span className="text-white/30">POST</span> https://i.instagram.com/api/v1/web/friendships/&#123;id&#125;/unfollow/</p>
                  <p style={{ color: "rgba(255,255,255,0.2)" }}>↳ Probeert de pending follow request te annuleren</p>
                  <p className="text-cyan mt-2"><span className="text-white/30">POST</span> /api/v1/friendships/destroy/&#123;id&#125;/</p>
                  <p style={{ color: "rgba(255,255,255,0.2)" }}>↳ Fallback als Instagram de eerste route niet goed bevestigt</p>
                </div>
                <p>Na elke actie leest InstaClean opnieuw de profielstatus uit. Daardoor telt een request alleen als geannuleerd wanneer Instagram niet langer &ldquo;Requested&rdquo; teruggeeft.</p>
              </div>
            </div>
          </Reveal>

          {/* What we DON'T access */}
          <Reveal delay={0.15}>
            <div className="rounded-2xl p-7" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="flex items-center gap-2 mb-4">
                <Lock size={16} style={{ color: "#10B981" }} />
                <h2 className="text-lg font-semibold">Wat wij NIET doen</h2>
              </div>
              <div className="space-y-2">
                {[
                  "Wij vragen nooit je wachtwoord",
                  "Wij slaan geen data op op onze servers",
                  "Wij hebben geen toegang tot je DM's, foto's, of profiel",
                  "Wij sturen geen data naar derden",
                  "Wij plaatsen geen cookies of trackers",
                  "Wij maken geen account aan namens jou",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                    <span className="text-green mt-0.5 flex-shrink-0">&#10003;</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Data flow */}
          <Reveal delay={0.2}>
            <div className="rounded-2xl p-7" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="flex items-center gap-2 mb-4">
                <Server size={16} style={{ color: "#8B5CF6" }} />
                <h2 className="text-lg font-semibold">Dataflow</h2>
              </div>
              <div className="space-y-4 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: "rgba(217,70,239,0.08)", color: "#D946EF" }}>1</div>
                  <p>Je uploadt je Instagram export <strong className="text-white/70">in je browser</strong>. Het bestand verlaat nooit je apparaat.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: "rgba(139,92,246,0.08)", color: "#8B5CF6" }}>2</div>
                  <p>Wij genereren een JavaScript script <strong className="text-white/70">client-side</strong>. Geen server betrokken.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: "rgba(6,182,212,0.08)", color: "#06B6D4" }}>3</div>
                  <p>Het script draait in <strong className="text-white/70">jouw browser tab</strong> op instagram.com. Communicatie gaat direct van jou naar Instagram.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: "rgba(16,185,129,0.08)", color: "#10B981" }}>4</div>
                  <p>Progress wordt opgeslagen in <strong className="text-white/70">localStorage</strong> op jouw apparaat. Wij zien dit niet.</p>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Open source */}
          <Reveal delay={0.25}>
            <div className="rounded-2xl p-7" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="flex items-center gap-2 mb-4">
                <Code2 size={16} style={{ color: "#06B6D4" }} />
                <h2 className="text-lg font-semibold">Open source</h2>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                Het gegenereerde script is volledig leesbaar. Er is geen obfuscatie, geen minificatie, geen verborgen code. Je kunt elke regel inspecteren voordat je het uitvoert. De volledige broncode van deze website is ook beschikbaar.
              </p>
            </div>
          </Reveal>

          {/* Risks */}
          <Reveal delay={0.3}>
            <div className="rounded-2xl p-7" style={{ background: "rgba(245,158,11,0.03)", border: "1px solid rgba(245,158,11,0.08)" }}>
              <div className="flex items-center gap-2 mb-4">
                <Globe size={16} className="text-amber-400" />
                <h2 className="text-lg font-semibold">Risico&rsquo;s</h2>
              </div>
              <div className="space-y-2 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                <p>Wij zijn transparant over de risico&rsquo;s:</p>
                <ul className="space-y-1.5 ml-4">
                  <li>• Instagram kan <strong className="text-white/70">rate limiting</strong> toepassen. Het script detecteert dit en pauzeert automatisch.</li>
                  <li>• In zeldzame gevallen kan Instagram je account <strong className="text-white/70">tijdelijk blokkeren</strong> (meestal 30-60 minuten).</li>
                  <li>• Dit is geen officieel Instagram product. Gebruik is op <strong className="text-white/70">eigen risico</strong>.</li>
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </main>
      <Footer />
    </div>
  );
}
