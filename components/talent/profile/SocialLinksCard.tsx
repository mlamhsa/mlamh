import type { ReactNode } from "react";

type SocialLinksCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
};

export default function SocialLinksCard({
  title,
  subtitle,
  children,
  className = "",
}: SocialLinksCardProps) {
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

      <div className="space-y-6">
        {children}
      </div>
    </section>
  );
}