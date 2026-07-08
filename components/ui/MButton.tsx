import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-gold text-black hover:bg-[#e0bd73]",
  secondary:
    "border border-white/10 bg-white/[0.035] text-white/75 hover:border-gold/40 hover:text-gold",
  ghost:
    "text-white/50 hover:text-gold",
  danger:
    "border border-red-400/20 bg-red-400/[0.06] text-red-300 hover:bg-red-400/10",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-3 rounded-full px-6 py-3 text-xs font-medium uppercase tracking-[0.22em] transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}