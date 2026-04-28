import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/Reveal";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacybeleid \u2014 InstaClean",
  description: "Hoe InstaClean omgaat met je privacy en gegevens.",
};

export default function Privacy() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-[700px] mx-auto px-6 pt-40 pb-20">
        <Reveal>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 600, letterSpacing: "-0.03em" }}>
            Privacybeleid
          </h1>
          <p className="mt-2 text-[1rem]" style={{ color: "rgba(255,255,255,0.4)" }}>
            Laatst bijgewerkt: april 2026
          </p>
        </Reveal>

        <div className="mt-10 space-y-8">
          {[
            {
              title: "1. Welke gegevens verzamelen wij?",
              content: "InstaClean verzamelt minimale gegevens:\n\n\u2022 Anonieme gebruiksstatistieken (paginabezoeken, tool-gebruik) \u2014 geen persoonlijk identificeerbare informatie\n\u2022 E-mailadressen die vrijwillig worden opgegeven via het \u201CNotify me\u201D formulier\n\nWij verzamelen GEEN Instagram-wachtwoorden, profielgegevens, berichten, foto\u2019s, of andere accountgegevens."
            },
            {
              title: "2. Instagram data verwerking",
              content: "Wanneer je een Instagram data-export uploadt naar de InstaClean tool:\n\n\u2022 Het bestand wordt ALLEEN in je browser verwerkt (client-side)\n\u2022 Er wordt NIETS naar onze servers gestuurd\n\u2022 Het gegenereerde script draait volledig lokaal in je browser\n\u2022 Wij hebben geen toegang tot je Instagram-account"
            },
            {
              title: "3. Cookies en tracking",
              content: "InstaClean gebruikt:\n\n\u2022 Geen cookies van derden\n\u2022 Geen Google Analytics of vergelijkbare services\n\u2022 Eigen anonieme event-tracking (pagina\u2019s bezocht, tool-acties) via Supabase\n\u2022 localStorage in je browser voor script-voortgang (alleen lokaal)"
            },
            {
              title: "4. E-mail opslag",
              content: "Als je je e-mailadres opgeeft via het \u201CNotify me\u201D formulier:\n\n\u2022 Je e-mail wordt veilig opgeslagen in onze database (Supabase)\n\u2022 Wij gebruiken het ALLEEN om je te informeren over nieuwe features\n\u2022 Wij verkopen of delen je e-mail NIET met derden\n\u2022 Je kunt je uitschrijven door ons te contacteren"
            },
            {
              title: "5. Beveiliging",
              content: "Wij nemen beveiliging serieus:\n\n\u2022 Alle verbindingen verlopen via HTTPS\n\u2022 De broncode is open source en inspecteerbaar\n\u2022 Wij slaan geen gevoelige gegevens op\n\u2022 Database-toegang is beperkt tot de beheerder"
            },
            {
              title: "6. Je rechten (AVG/GDPR)",
              content: "Je hebt het recht om:\n\n\u2022 Te weten welke gegevens wij van je hebben\n\u2022 Je gegevens te laten verwijderen\n\u2022 Je e-mailadres te laten verwijderen uit ons systeem\n\u2022 Een kopie van je gegevens op te vragen\n\nNeem contact op via het e-mailadres hieronder."
            },
            {
              title: "7. Contact",
              content: "Voor vragen over privacy kun je ons bereiken via de GitHub repository van het project."
            },
          ].map((section) => (
            <Reveal key={section.title}>
              <div className="rounded-xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <h2 className="text-base font-semibold mb-3">{section.title}</h2>
                <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "rgba(255,255,255,0.45)" }}>
                  {section.content}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
