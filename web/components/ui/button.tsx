import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white hover:opacity-90 shadow-lg shadow-pink-500/25",
  secondary:
    "bg-white text-foreground border border-border hover:bg-surface",
  ghost: "text-muted hover:text-foreground hover:bg-surface",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
