"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface Props {
  end: number;
  suffix?: string;
  duration?: number;
}

export function AnimatedCounter({ end, suffix = "", duration = 2000 }: Props) {
  const [display, setDisplay] = useState("0");
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  const animate = useCallback(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutQuad
      const eased = progress * (2 - progress);
      const current = eased * end;

      // Format: if end has decimals, show one decimal
      if (end % 1 !== 0) {
        setDisplay(current.toFixed(1));
      } else {
        setDisplay(String(Math.round(current)));
      }

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        // Ensure exact final value
        setDisplay(end % 1 !== 0 ? end.toFixed(1) : String(end));
      }
    };

    requestAnimationFrame(tick);
  }, [end, duration]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reduced motion: show final value immediately
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const frame = requestAnimationFrame(() => setDisplay(end % 1 !== 0 ? end.toFixed(1) : String(end)));
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          animate();
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [end, animate]);

  return (
    <span ref={ref} className="tabular-nums">
      {display}
      {suffix}
    </span>
  );
}
