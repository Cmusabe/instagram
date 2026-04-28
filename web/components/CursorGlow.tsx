"use client";

import { useEffect, useRef } from "react";

export default function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.innerWidth < 768) return;

    const glow = glowRef.current;
    if (!glow) return;

    const onMove = (e: MouseEvent) => {
      glow.style.transform = `translate(${e.clientX - 200}px, ${e.clientY - 200}px)`;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div
      ref={glowRef}
      className="fixed pointer-events-none hidden md:block"
      style={{
        width: 400,
        height: 400,
        borderRadius: "50%",
        background:
          "radial-gradient(circle, rgba(225,48,108,0.07) 0%, transparent 70%)",
        zIndex: 1,
        transition: "transform 0.15s ease-out",
      }}
      aria-hidden="true"
    />
  );
}
