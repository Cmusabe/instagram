"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();
  const isEN = pathname.startsWith("/en");
  const prefix = isEN ? "/en" : "";

  return (
    <footer className="max-w-[1200px] mx-auto px-6 pt-16 pb-8">
      <div className="h-px mb-10" style={{ background: "linear-gradient(90deg, transparent 5%, rgba(217,70,239,0.12) 30%, rgba(139,92,246,0.08) 50%, rgba(6,182,212,0.06) 70%, transparent 95%)" }} />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        <Link href={isEN ? "/en" : "/"} className="flex items-center">
          <img src="/logo/instaclean-logo.png" alt="InstaClean" className="h-8 w-auto opacity-70 hover:opacity-100 transition-opacity" />
        </Link>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12px]" style={{ color: "rgba(255,255,255,0.25)" }}>
          <Link href={`${prefix}/tool`} className="hover:text-white/50 transition-colors duration-300">Tool</Link>
          <Link href={`${prefix}/how-it-works`} className="hover:text-white/50 transition-colors duration-300">
            {isEN ? "How it works" : "Hoe het werkt"}
          </Link>
          <Link href={`${prefix}/faq`} className="hover:text-white/50 transition-colors duration-300">FAQ</Link>
          <Link href="/transparantie" className="hover:text-white/50 transition-colors duration-300">
            {isEN ? "Transparency" : "Transparantie"}
          </Link>
          <Link href="/changelog" className="hover:text-white/50 transition-colors duration-300">Changelog</Link>
          <Link href="/contact" className="hover:text-white/50 transition-colors duration-300">Contact</Link>
          <Link href="/privacy" className="hover:text-white/50 transition-colors duration-300">Privacy</Link>
        </div>
      </div>

      <p className="text-center mt-8 text-[10px]" style={{ color: "rgba(255,255,255,0.12)" }}>
        &copy; {new Date().getFullYear()} InstaClean &middot; Open source &middot; {isEN ? "Built with" : "Gebouwd met"} &#9829; {isEN ? "in the Netherlands" : "in Nederland"} &#127475;&#127473;
      </p>
    </footer>
  );
}
