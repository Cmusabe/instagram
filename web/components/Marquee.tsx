"use client";

import type { ReactNode } from "react";

export function Marquee({ children, reverse = false }: { children: ReactNode; reverse?: boolean }) {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none" style={{ background: "linear-gradient(to right, #07070D, transparent)" }} />
      <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none" style={{ background: "linear-gradient(to left, #07070D, transparent)" }} />
      <div className={`marquee-row ${reverse ? "marquee-right" : "marquee-left"}`}>
        <div className="flex gap-5 pr-5">{children}</div>
        <div className="flex gap-5 pr-5" aria-hidden="true">{children}</div>
      </div>
    </div>
  );
}
