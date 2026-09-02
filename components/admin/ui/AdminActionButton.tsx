type AdminActionButtonVariant =
  | "default"
  | "gold"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "muted";

const variants: Record<AdminActionButtonVariant, string> = {
  default: "border-white/10 bg-white/[0.025] text-white/65 hover:border-gold/35 hover:bg-white/[0.055] hover:text-white",
  gold: "border-gold/30 bg-gold/[0.07] text-gold shadow-[0_8px_30px_rgba(212,175,55,0.06)] hover:border-gold/55 hover:bg-gold/[0.13] hover:shadow-[0_12px_36px_rgba(212,175,55,0.12)]",
  success: "border-emerald-500/30 bg-emerald-500/[0.07] text-emerald-300 hover:border-emerald-400/50 hover:bg-emerald-500/[0.13]",
  warning: "border-yellow-500/30 bg-yellow-500/[0.07] text-yellow-300 hover:border-yellow-400/50 hover:bg-yellow-500/[0.13]",
  danger: "border-red-500/30 bg-red-500/[0.07] text-red-300 hover:border-red-400/50 hover:bg-red-500/[0.13]",
  info: "border-blue-500/30 bg-blue-500/[0.07] text-blue-300 hover:border-blue-400/50 hover:bg-blue-500/[0.13]",
  muted: "border-zinc-500/25 bg-zinc-500/[0.05] text-zinc-300 hover:border-zinc-400/40 hover:bg-zinc-500/[0.1]",
};

export function AdminActionButton({ children, variant = "default", type = "button" }: { children: React.ReactNode; variant?: AdminActionButtonVariant; type?: "button" | "submit"; }) {
  return (
    <button
      type={type}
      className={`group relative inline-flex min-h-11 select-none items-center justify-center overflow-hidden rounded-xl border px-5 py-2.5 text-[11px] font-medium tracking-[0.08em] outline-none transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-[1px] active:scale-[0.985] active:shadow-none focus-visible:ring-2 focus-visible:ring-gold/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-45 ${variants[variant]}`}
    >
      <span className="pointer-events-none absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/[0.07] to-transparent transition-transform duration-500 group-hover:translate-x-[120%]" />
      <span className="relative">{children}</span>
    </button>
  );
}
