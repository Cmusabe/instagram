"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

// Map of NL paths that have EN equivalents
const ROUTE_MAP: Record<string, string> = {
  "/": "/en",
  "/tool": "/en/tool",
  "/how-it-works": "/en/how-it-works",
  "/faq": "/en/faq",
  // EN → NL
  "/en": "/",
  "/en/tool": "/tool",
  "/en/how-it-works": "/how-it-works",
  "/en/faq": "/faq",
};

export function Navbar({ variant }: { variant?: string } = {}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const isEN = pathname.startsWith("/en");
  const prefix = isEN ? "/en" : "";
  const home = isEN ? "/en" : "/";

  // Language switch: map to equivalent page, or fallback to home
  const switchUrl = ROUTE_MAP[pathname] || (isEN ? "/" : "/en");
  const switchLabel = isEN ? "NL" : "EN";

  const links = isEN
    ? [{ href: "/en/how-it-works", label: "HOW IT WORKS" }, { href: "/en/faq", label: "FAQ" }]
    : [{ href: "/how-it-works", label: "HOE HET WERKT" }, { href: "/faq", label: "FAQ" }];

  const toolHref = `${prefix}/tool`;
  const startLabel = isEN ? "START NOW" : "START NU";

  return (
    <header
      className="fixed top-0 inset-x-0 z-50 transition-all duration-500"
      style={{
        background: scrolled ? "rgba(7,7,13,0.8)" : "transparent",
        backdropFilter: scrolled ? "blur(32px) saturate(1.5)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(32px) saturate(1.5)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.04)" : "1px solid transparent",
      }}
    >
      <nav className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between">
        <Link href={home} className="flex items-center gap-1.5">
          <img src="/logo/instaclean-logo.png" alt="InstaClean" className="h-8 sm:h-10 w-auto" />
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-10">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[13px] font-normal tracking-[0.05em] transition-colors duration-300"
              style={{ color: pathname === l.href ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)" }}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href={switchUrl}
            className="text-[11px] font-medium px-2 py-1 rounded-md transition-colors hover:bg-white/[0.04]"
            style={{ color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            {switchLabel}
          </Link>
          <kbd
            className="hidden lg:inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-md cursor-pointer transition-colors hover:bg-white/[0.03]"
            style={{ background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.05)" }}
            onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
          >
            <span>⌘</span>K
          </kbd>
          <Link
            href={toolHref}
            className="text-[12px] tracking-[0.1em] font-normal rounded-full px-5 py-2 transition-all duration-300 hover:bg-white/[0.04]"
            style={{ color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.15)" }}
          >
            {startLabel}
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setOpen(!open)} className="md:hidden p-1 cursor-pointer" aria-label="Menu">
          <div className="relative w-5 h-4">
            <span className={`absolute left-0 w-5 h-px bg-white/50 transition-all duration-300 ${open ? "top-[7px] rotate-45" : "top-0"}`} />
            <span className={`absolute left-0 top-[7px] w-5 h-px bg-white/50 transition-opacity duration-200 ${open ? "opacity-0" : ""}`} />
            <span className={`absolute left-0 w-5 h-px bg-white/50 transition-all duration-300 ${open ? "top-[7px] -rotate-45" : "top-[14px]"}`} />
          </div>
        </button>
      </nav>

      {/* Mobile menu */}
      <div className="md:hidden overflow-hidden transition-all duration-300" style={{ maxHeight: open ? "200px" : "0", opacity: open ? 1 : 0 }}>
        <div className="px-6 py-3 space-y-2 border-t border-white/[0.04]">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block text-[13px] text-white/40 hover:text-white/70 transition-colors py-1.5">
              {l.label}
            </Link>
          ))}
          <Link href={switchUrl} onClick={() => setOpen(false)} className="block text-[13px] text-white/40 hover:text-white/70 transition-colors py-1.5">
            {isEN ? "🇳🇱 Nederlands" : "🇬🇧 English"}
          </Link>
          <Link href={toolHref} onClick={() => setOpen(false)} className="block text-center text-[12px] tracking-[0.1em] rounded-full py-2 mt-1 text-white/90" style={{ background: "linear-gradient(135deg, #D946EF, #8B5CF6)" }}>
            {startLabel}
          </Link>
        </div>
      </div>
    </header>
  );
}
