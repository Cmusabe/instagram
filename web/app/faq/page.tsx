import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/Reveal";
import { FaqContent } from "@/components/FaqContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ \u2014 InstaClean",
  description: "Veelgestelde vragen over InstaClean.",
};

const FAQS = [
  { q: "Is dit veilig om te gebruiken?", a: "Het script draait volledig lokaal in je browser. Wij hebben nooit toegang tot je account of wachtwoord. Je kunt het script volledig inzien voordat je het uitvoert." },
  { q: "Moet ik mijn wachtwoord invullen?", a: "Nee! Je logt zelf in op Instagram in je browser. Het script gebruikt je bestaande sessie. Wij vragen nooit om je wachtwoord." },
  { q: "Kan mijn account geblokkeerd worden?", a: "Instagram kan cooldowns of rate limiting toepassen bij veel automatische acties. InstaClean gebruikt daarom rustige standaardinstellingen, kleine batches en automatische pauzes. Als Instagram toch een cooldown vraagt, wacht 10\u201315 minuten en hervat pas daarna." },
  { q: "Hoe lang duurt het om alles te annuleren?", a: "Dat hangt af van het aantal accounts en Instagram's limieten. Met de aanbevolen instelling (30s vertraging, batches van 5, 5 minuten batchpauze) duurt het langer, maar is de kans op cooldown veel kleiner." },
  { q: "Kan ik stoppen en later verder gaan?", a: "Ja! Het script slaat voortgang op in je browser (localStorage). Als je het opnieuw uitvoert, worden eerder verwerkte accounts overgeslagen." },
  { q: "Wat als het script stopt of crasht?", a: "Geen probleem. Dankzij de progress tracking kun je het script gewoon opnieuw plakken en uitvoeren. Het gaat verder waar het was gebleven." },
  { q: "Hoe krijg ik mijn Instagram data export?", a: "Ga naar Instagram Instellingen > Accounts Center > Je informatie downloaden > Selecteer \u2018Volgers en volgend\u2019 > Kies HTML formaat. Download het bestand wanneer het klaar is." },
  { q: "Kan ik ook usernames handmatig invullen?", a: "Ja! In de tool kun je kiezen om usernames direct te plakken in plaats van een HTML bestand te uploaden. Zet elke username op een nieuwe regel." },
  { q: "Werkt dit ook op telefoon?", a: "Het script moet in een browser console draaien, wat het makkelijkst is op desktop (Chrome, Firefox, Edge). Op mobiel is dit technisch lastig." },
  { q: "Worden mijn gegevens opgeslagen?", a: "Nee. Alle verwerking gebeurt lokaal in je browser. Er worden geen gegevens naar onze servers gestuurd. De website is volledig statisch." },
];

export default function FAQ() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-[700px] mx-auto px-6 pt-40 pb-20">
        <Reveal>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 600, letterSpacing: "-0.03em" }}>
            Veelgestelde vragen
          </h1>
          <p className="mt-2 text-[1rem]" style={{ color: "rgba(255,255,255,0.4)" }}>
            Alles wat je moet weten over InstaClean.
          </p>
        </Reveal>
        <FaqContent faqs={FAQS} />
        <div className="text-center mt-10">
          <a href="/tool" className="inline-flex items-center gap-2 rounded-xl px-8 py-4 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5" style={{ background: "linear-gradient(135deg, #D946EF, #8B5CF6)", boxShadow: "0 0 16px rgba(217,70,239,0.2)" }}>
            Ga naar de tool
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}
