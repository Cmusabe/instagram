"use client";

import { motion } from "framer-motion";
import type { ReactNode, CSSProperties } from "react";

const ease = [0.25, 0.1, 0, 1] as [number, number, number, number];

export function Reveal({ children, delay = 0, direction = "up", className = "", style }: {
  children: ReactNode; delay?: number; direction?: "up" | "none"; className?: string; style?: CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: direction === "up" ? 30 : 0 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0 }}
      transition={{ duration: 0.8, delay, ease }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

export function FadeIn({ children, delay = 0, className = "" }: {
  children: ReactNode; delay?: number; className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
