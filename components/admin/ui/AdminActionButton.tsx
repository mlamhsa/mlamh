type AdminActionButtonVariant =
  | "default"
  | "gold"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "muted";

const variants: Record<AdminActionButtonVariant, string> = {
  default: "border-white/10 text-white/60 hover:border-gold/40 hover:text-gold",
  gold: "border-gold/30 bg-gold/[0.04] text-gold hover:bg-gold/10",
  success:
    "border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-300 hover:bg-emerald-500/10",
  warning:
    "border-yellow-500/30 bg-yellow-500/[0.06] text-yellow-300 hover:bg-yellow-500/10",
  danger:
    "border-red-500/30 bg-red-500/[0.06] text-red-300 hover:bg-red-500/10",
  info: "border-blue-500/30 bg-blue-500/[0.06] text-blue-300 hover:bg-blue-500/10",
  muted:
    "border-zinc-500/30 bg-zinc-500/[0.06] text-zinc-300 hover:bg-zinc-500/10",
};

export function AdminActionButton({
  children,
  variant = "default",
  type = "button",
}: {
  children: React.ReactNode;
  variant?: AdminActionButtonVariant;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      className={`rounded-full border px-5 py-3 text-[10px] uppercase tracking-[0.25em] transition ${variants[variant]}`}
    >
      {children}
    </button>
  );
}