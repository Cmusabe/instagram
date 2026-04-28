"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

export function CountUp({ end, suffix = "", duration = 2200, className = "" }: {
  end: number; suffix?: string; duration?: number; className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [val, setVal] = useState("0");

  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const frame = requestAnimationFrame(() => setVal(end % 1 !== 0 ? end.toFixed(1) : String(end)));
      return () => cancelAnimationFrame(frame);
    }
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const e = 1 - Math.pow(1 - p, 4);
      setVal(end % 1 !== 0 ? (e * end).toFixed(1) : String(Math.round(e * end)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, end, duration]);

  return <span ref={ref} className={`tabular-nums ${className}`}>{val}{suffix}</span>;
}
