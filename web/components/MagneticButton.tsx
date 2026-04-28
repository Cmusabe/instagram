"use client";

import { useRef, useState, type ReactNode, type MouseEvent } from "react";

export function MagneticButton({ children, className = "", href, style: extraStyle }: {
  children: ReactNode; className?: string; href?: string; style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const move = (e: MouseEvent) => {
    if (!ref.current || window.innerWidth < 768) return;
    const r = ref.current.getBoundingClientRect();
    setOffset({ x: (e.clientX - r.left - r.width / 2) * 0.12, y: (e.clientY - r.top - r.height / 2) * 0.12 });
  };

  const Tag = href ? "a" : "button";
  return (
    <Tag
      ref={ref as React.RefObject<HTMLAnchorElement & HTMLButtonElement>}
      href={href}
      onMouseMove={move}
      onMouseLeave={() => setOffset({ x: 0, y: 0 })}
      className={className}
      style={{ ...extraStyle, transform: `translate(${offset.x}px, ${offset.y}px)`, transition: "transform 0.35s cubic-bezier(0.22,1,0.36,1)" }}
    >
      {children}
    </Tag>
  );
}
