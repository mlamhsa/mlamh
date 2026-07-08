import type { ReactNode } from "react";

type MeasurementsCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
};

export default function MeasurementsCard({
  title,
  subtitle,
  children,
  className = "",
}: MeasurementsCardProps) {
  return (
    <section
      className={`rounded-2xl border border-white/10 bg-white/[0.02] p-6 shadow-sm ${className}`}
    >
      <header className="mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-gold">
          {title}
        </h2>

        {subtitle && (
          <p className="mt-2 text-sm text-white/50">
            {subtitle}
          </p>
        )}
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {children}
      </div>
    </section>
  );
}