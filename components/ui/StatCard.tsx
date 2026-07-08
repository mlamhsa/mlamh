import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  icon,
  hint,
  highlighted = false,
  className = "",
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
  hint?: string;
  highlighted?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[1.75rem] border p-5 ${
        highlighted
          ? "border-gold/20 bg-gold/[0.04]"
          : "border-white/10 bg-white/[0.025]"
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs uppercase tracking-[0.25em] text-white/40">
          {label}
        </p>

        {icon ? <span className="text-gold">{icon}</span> : null}
      </div>

      <p className="mt-3 text-4xl font-light text-white">{value}</p>

      {hint ? <p className="mt-2 text-xs text-white/35">{hint}</p> : null}
    </div>
  );
}