"use client";

import { AnimatedCounter } from "./AnimatedCounter";
import { ScrollReveal } from "./ScrollReveal";

const stats = [
  { end: 127, suffix: "K+", label: "Requests geannuleerd" },
  { end: 2847, suffix: "+", label: "Tevreden gebruikers" },
  { end: 100, suffix: "%", label: "Lokaal & veilig" },
  { end: 0, suffix: "", label: "Data verzonden" },
];

const reviews = [
  {
    name: "Thomas K.",
    initials: "TK",
    gradient: "from-pink-500 to-rose-400",
    text: "Had 2000+ pending requests. InstaClean had alles in 30 minuten geannuleerd. Ongelooflijk!",
  },
  {
    name: "Sara M.",
    initials: "SM",
    gradient: "from-purple-500 to-violet-400",
    text: "Eindelijk een tool die WERKT en geen wachtwoord vraagt. Top!",
  },
  {
    name: "Bram V.",
    initials: "BV",
    gradient: "from-blue-500 to-indigo-400",
    text: "Ik was sceptisch maar het script doet precies wat het belooft. Aanrader!",
  },
];

export function SocialProof() {
  return (
    <section className="border-t border-b border-border py-10" style={{ background: "rgba(18,18,26,0.5)" }}>
      <div className="max-w-5xl mx-auto px-4">
        {/* Stats */}
        <ScrollReveal>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="glass-card rounded-xl p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-white/10 cursor-default"
              >
                <div className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  <AnimatedCounter end={stat.end} suffix={stat.suffix} duration={stat.end === 0 ? 100 : 2000} />
                </div>
                <p className="text-[11px] text-text-secondary mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Testimonials */}
        <ScrollReveal>
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-8">
            Wat gebruikers zeggen
          </h2>
        </ScrollReveal>

        <div className="grid sm:grid-cols-3 gap-4">
          {reviews.map((review, i) => (
            <ScrollReveal key={review.name} delay={i * 120}>
              <div className="relative glass-card rounded-xl p-6 min-h-[180px] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-white/10 cursor-default">
                {/* Big quote mark */}
                <span className="absolute top-3 left-4 text-5xl font-serif leading-none gradient-text-animated opacity-15 select-none pointer-events-none">
                  &ldquo;
                </span>
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${review.gradient} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}>
                      {review.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text">{review.name}</p>
                      <div className="flex gap-0.5 mt-0.5">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <span key={j} className="text-amber-400 text-xs">&#9733;</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">&ldquo;{review.text}&rdquo;</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
