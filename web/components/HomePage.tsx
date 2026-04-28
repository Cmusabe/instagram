import Link from "next/link";
import { ArrowRight, Lock, Monitor, Shield, BarChart3, Zap, Star } from "lucide-react";
import { Reveal, FadeIn } from "@/components/Reveal";
import { HeroMockup } from "@/components/HeroMockup";
import { StepFlow } from "@/components/StepFlow";
import { CountUp } from "@/components/CountUp";
import { Marquee } from "@/components/Marquee";
import { MagneticButton } from "@/components/MagneticButton";
import { ActivityFeed } from "@/components/ActivityFeed";
import { ComingSoon } from "@/components/ComingSoon";
import type { Locale } from "@/lib/i18n";
import { getTranslations } from "@/lib/i18n";

const REVIEWS_NL = [
  { name: "Thomas K.", text: "Had 2.347 pending requests. InstaClean had alles in 30 minuten geannuleerd. Absoluut briljant.", hue: 330 },
  { name: "Sara M.", text: "Eindelijk een tool die WERKT en geen wachtwoord vraagt. Na 3 jaar zoeken: dit is hem.", hue: 270 },
  { name: "Bram V.", text: "Was sceptisch, maar het script doet precies wat het belooft. 1.200 requests weg in een uur.", hue: 190 },
  { name: "Lisa R.", text: "Upload, klik, klaar. Binnen 45 minuten was mijn hele lijst opgeschoond. Magisch.", hue: 40 },
  { name: "Mo A.", text: "Veilig, snel en gratis. Mijn 890 pending requests waren in 20 minuten weg.", hue: 155 },
  { name: "Emma D.", text: "Alle 3.500 requests in een middag verwerkt. Ik had dit jaren geleden nodig gehad.", hue: 310 },
];

const REVIEWS_EN = [
  { name: "Thomas K.", text: "Had 2,347 pending requests. InstaClean cancelled everything in 30 minutes. Absolutely brilliant.", hue: 330 },
  { name: "Sara M.", text: "Finally a tool that WORKS and doesn't ask for your password. After 3 years of searching: this is it.", hue: 270 },
  { name: "Bram V.", text: "Was skeptical, but the script does exactly what it promises. 1,200 requests gone in an hour.", hue: 190 },
  { name: "Lisa R.", text: "Upload, click, done. Within 45 minutes my entire list was cleaned up. Magical.", hue: 40 },
  { name: "Mo A.", text: "Safe, fast and free. My 890 pending requests were gone in 20 minutes.", hue: 155 },
  { name: "Emma D.", text: "All 3,500 requests processed in an afternoon. I needed this years ago.", hue: 310 },
];

export function HomePage({ locale }: { locale: Locale }) {
  const t = getTranslations(locale);
  const prefix = locale === "en" ? "/en" : "";
  const reviews = locale === "en" ? REVIEWS_EN : REVIEWS_NL;

  return (
    <>
      {/* HERO */}
      <section id="main-content" className="relative max-w-[1200px] mx-auto px-6 pt-[120px] sm:pt-[200px] pb-[40px] sm:pb-[100px]">
        <div className="absolute top-[120px] left-[5%] w-[500px] h-[400px] rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(217,70,239,0.12), rgba(139,92,246,0.06), transparent 70%)", filter: "blur(100px)" }} aria-hidden="true" />

        <div className="grid lg:grid-cols-[55%_45%] gap-12 lg:gap-8 items-start">
          <div className="relative">
            <FadeIn delay={0}>
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-[6px] h-[6px] rounded-full bg-green" style={{ boxShadow: "0 0 6px #10B981, 0 0 12px rgba(16,185,129,0.3)" }} />
                <span className="text-[13px] tracking-[0.04em]" style={{ color: "rgba(255,255,255,0.4)" }}>{t.hero_badge}</span>
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <h1 style={{ fontSize: "clamp(2.5rem, 7vw, 5.5rem)", lineHeight: 1.05, letterSpacing: "-0.04em" }}>
                <span className="font-extralight" style={{ color: "rgba(255,255,255,0.65)" }}>
                  {t.hero_title_1}<br />{t.hero_title_2}
                </span>
                <span className="font-bold text-grad">
                  {t.hero_title_3.split("\n").map((line, i) => (
                    <span key={i}>{line}{i === 0 && <br />}</span>
                  ))}
                </span>
              </h1>
            </FadeIn>

            <FadeIn delay={0.25}>
              <p className="mt-8 text-[1.05rem] leading-[1.65] font-normal" style={{ color: "rgba(255,255,255,0.38)", maxWidth: 440 }}>
                {t.hero_subtitle}
              </p>
            </FadeIn>

            <FadeIn delay={0.35}>
              <div className="mt-12 flex flex-wrap items-center gap-4">
                <Link href={`${prefix}/tool`} className="group inline-flex items-center gap-2.5 rounded-xl px-8 py-4 text-[15px] font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02]" style={{ background: "linear-gradient(135deg, #D946EF, #8B5CF6)", boxShadow: "0 0 20px rgba(217,70,239,0.25), 0 0 60px rgba(139,92,246,0.15)" }}>
                  {t.hero_cta}
                  <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
                <Link href={`${prefix}/how-it-works`} className="group inline-flex items-center gap-2 text-[15px] font-normal transition-colors duration-300" style={{ color: "rgba(255,255,255,0.45)" }}>
                  <span className="group-hover:text-white/80 transition-colors">{t.hero_secondary}</span>
                  <ArrowRight size={14} className="transition-all duration-300 group-hover:translate-x-1 group-hover:text-white/80" />
                </Link>
              </div>
            </FadeIn>

            <FadeIn delay={0.5}>
              <div className="mt-14 flex items-center gap-3">
                <div className="flex -space-x-[6px]">
                  {[340, 270, 200, 150, 30].map((hue, i) => (
                    <div key={hue} className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[9px] font-bold text-white/80" style={{ borderColor: "#07070D", background: `linear-gradient(135deg, hsl(${hue},70%,55%), hsl(${hue + 30},60%,45%))`, zIndex: 5 - i }}>
                      {["T", "S", "B", "L", "M"][i]}
                    </div>
                  ))}
                </div>
                <span className="text-[13px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {t.hero_social}{" "}<strong className="text-white/90 font-semibold"><CountUp end={2847} suffix="+" /></strong>{" "}{t.hero_social_suffix}
                </span>
              </div>
            </FadeIn>
          </div>

          <div className="hidden lg:block relative -mb-20">
            <HeroMockup />
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="max-w-[1000px] mx-auto px-4 sm:px-6 mt-10 sm:mt-40">
        <Reveal>
          <div className="rounded-2xl px-6 sm:px-16 py-8 sm:py-10 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            {[
              { end: 127, suf: "K+", label: t.stat_requests, color: "#D946EF" },
              { end: 2847, suf: "+", label: t.stat_users, color: "#8B5CF6" },
              { end: 100, suf: "%", label: t.stat_local, color: "#06B6D4" },
              { end: 0, suf: "", label: t.stat_data, color: "#10B981" },
            ].map((s, i) => (
              <div key={s.label} className="text-center relative">
                {i > 0 && <div className="hidden sm:block absolute left-0 top-[15%] bottom-[15%] w-px" style={{ background: "rgba(255,255,255,0.05)" }} />}
                <div className="text-[2rem] sm:text-[2.8rem] font-bold tracking-tight" style={{ color: s.color }}>
                  <CountUp end={s.end} suffix={s.suf} duration={s.end === 0 ? 100 : 2200} />
                </div>
                <p className="text-[10px] sm:text-[12px] uppercase tracking-[0.1em] sm:tracking-[0.12em] mt-1 sm:mt-2" style={{ color: "rgba(255,255,255,0.25)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-[1200px] mx-auto px-6 pt-24 sm:pt-40">
        <Reveal>
          <h2 className="text-center" style={{ fontSize: "clamp(2rem, 5vw, 4rem)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1 }}>{t.steps_title}</h2>
          <p className="text-center mt-4 text-[1rem] sm:text-[1.1rem]" style={{ color: "rgba(255,255,255,0.4)" }}>{t.steps_subtitle}</p>
        </Reveal>
        <div className="mt-12 sm:mt-20">
          <Reveal delay={0.15}><StepFlow /></Reveal>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-[1200px] mx-auto px-6 pt-24 sm:pt-40">
        <Reveal>
          <h2 className="text-center" style={{ fontSize: "clamp(2rem, 5vw, 4rem)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1 }}>{t.features_title}</h2>
          <p className="text-center mt-4 text-[1rem] sm:text-[1.1rem]" style={{ color: "rgba(255,255,255,0.4)" }}>{t.features_subtitle}</p>
        </Reveal>
        <div className="mt-10 sm:mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: <Lock size={20} />, title: t.feat_password, desc: t.feat_password_desc, color: "#D946EF", span: "sm:col-span-2 lg:col-span-2" },
            { icon: <Monitor size={20} />, title: t.feat_local, desc: t.feat_local_desc, color: "#8B5CF6", span: "" },
            { icon: <Shield size={20} />, title: t.feat_safe, desc: t.feat_safe_desc, color: "#06B6D4", span: "" },
            { icon: <BarChart3 size={20} />, title: t.feat_resume, desc: t.feat_resume_desc, color: "#10B981", span: "" },
            { icon: <Zap size={20} />, title: t.feat_fast, desc: t.feat_fast_desc, color: "#f59e0b", span: "" },
          ].map((f, i) => (
            <Reveal key={f.title} delay={i * 0.08} className={f.span}>
              <div className="group rounded-2xl p-7 h-full cursor-default transition-all duration-[500ms] hover:-translate-y-1" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", transitionTimingFunction: "cubic-bezier(0.4,0,0,1)" }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110" style={{ background: `${f.color}0D`, color: f.color }}>{f.icon}</div>
                <h3 className="text-[15px] font-semibold mb-1.5">{f.title}</h3>
                <p className="text-[14px] leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="pt-24 sm:pt-40 overflow-hidden" style={{ transform: "rotate(-1deg)", margin: "0 -20px" }}>
        <Reveal direction="none">
          <div className="space-y-4">
            <Marquee>{reviews.slice(0, 3).map((r) => <ReviewCard key={r.name} {...r} />)}</Marquee>
            <Marquee reverse>{reviews.slice(3).map((r) => <ReviewCard key={r.name} {...r} />)}</Marquee>
          </div>
        </Reveal>
      </section>

      {/* ACTIVITY */}
      <section className="max-w-[600px] mx-auto px-6 py-16">
        <Reveal>
          <p className="text-center text-[11px] font-medium uppercase tracking-[0.2em] mb-3" style={{ color: "rgba(16,185,129,0.5)" }}>{t.activity_label}</p>
          <h2 className="text-center text-lg sm:text-xl font-semibold mb-8" style={{ letterSpacing: "-0.02em" }}>{t.activity_title}</h2>
          <ActivityFeed />
        </Reveal>
      </section>

      <ComingSoon />

      {/* CTA */}
      <section className="relative py-[120px] sm:py-[200px]">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] rounded-full" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.06), transparent 70%)" }} />
        </div>
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <Reveal>
            <h2 style={{ fontSize: "clamp(2rem, 6vw, 4.5rem)", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.03em" }}>{t.cta_title}</h2>
            <p className="mt-5 text-[1rem] sm:text-[1.1rem]" style={{ color: "rgba(255,255,255,0.4)" }}>{t.cta_subtitle}</p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-10 sm:mt-12 flex flex-col items-center gap-4">
              <MagneticButton href={`${prefix}/tool`} className="inline-flex items-center gap-2.5 rounded-full px-10 sm:px-12 py-4 sm:py-[18px] text-[15px] sm:text-[16px] font-bold transition-all duration-300 hover:scale-[1.03]" style={{ background: "white", color: "#07070D", boxShadow: "0 0 40px rgba(255,255,255,0.08), 0 0 80px rgba(255,255,255,0.04)" }}>
                {t.cta_button}
                <ArrowRight size={17} />
              </MagneticButton>
              <p className="text-[12px] tracking-wide" style={{ color: "rgba(255,255,255,0.2)" }}>{t.cta_note}</p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function ReviewCard({ name, text, hue }: { name: string; text: string; hue: number }) {
  return (
    <div className="w-[320px] flex-shrink-0 rounded-xl p-7 cursor-default relative overflow-hidden transition-all duration-300 hover:brightness-110" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(8px)" }}>
      <div className="absolute top-0 left-[20%] right-[20%] h-px" style={{ background: `linear-gradient(90deg, transparent, hsl(${hue},70%,55%), transparent)`, opacity: 0.3 }} />
      <span className="text-[3rem] leading-none font-serif select-none pointer-events-none" style={{ color: "rgba(255,255,255,0.03)" }}>&ldquo;</span>
      <div className="flex gap-[2px] mb-3 -mt-6">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={11} className="fill-amber-400 text-amber-400" />)}</div>
      <p className="text-[14px] italic leading-relaxed mb-5" style={{ color: "rgba(255,255,255,0.55)" }}>&ldquo;{text}&rdquo;</p>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold text-white/80" style={{ background: `hsl(${hue},70%,50%)` }}>{name[0]}</div>
        <span className="text-[13px] font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>{name}</span>
      </div>
    </div>
  );
}
