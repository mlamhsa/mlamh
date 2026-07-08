import type { ReactNode } from "react";

type PublisherStatCardProps = {
  label: string;
  value: number | string;
  icon?: ReactNode;
  hint?: string;
};

export default function PublisherStatCard({
  label,
  value,
  icon,
  hint,
}: PublisherStatCardProps) {
  return (
    <div className="group rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 transition-all duration-300 hover:border-gold/30 hover:bg-white/[0.05]">
      {icon ? (
        <div className="mb-5 inline-flex rounded-2xl border border-gold/20 bg-gold/[0.06] p-3 text-gold">
          {icon}
        </div>
      ) : null}

      <p className="text-xs uppercase tracking-[0.25em] text-white/40">
        {label}
      </p>

      <p className="mt-3 text-5xl font-light text-white">
        {value}
      </p>

      {hint ? (
        <p className="mt-4 text-xs leading-6 text-white/35">
          {hint}
        </p>
      ) : null}
    </div>
  );
}