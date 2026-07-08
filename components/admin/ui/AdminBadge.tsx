import type { ReactNode } from "react";

export type BadgeVariant =
  | "default"
  | "gold"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "muted";

const variants: Record<BadgeVariant, string> = {
  default: "border-white/10 bg-white/5 text-white/60",
  gold: "border-gold/30 bg-gold/10 text-gold",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  warning: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
  danger: "border-red-500/30 bg-red-500/10 text-red-300",
  info: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  muted: "border-zinc-500/30 bg-zinc-500/10 text-zinc-300",
};

type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

export function AdminBadge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}