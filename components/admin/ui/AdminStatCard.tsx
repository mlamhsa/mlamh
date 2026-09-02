import Link from "next/link";

export function AdminStatCard({
  label,
  value,
  href,
  active = false,
}: {
  label: string;
  value: number | string;
  href?: string;
  active?: boolean;
}) {
  const interactive = Boolean(href);
  const className = `admin-stat-card group relative overflow-hidden rounded-2xl border p-4 transition-all duration-200 ease-out sm:rounded-3xl sm:p-5 ${
    active
      ? "border-gold/40 bg-gold/[0.07] shadow-[0_12px_34px_rgba(212,175,55,0.08)]"
      : "border-white/[0.08] bg-gradient-to-b from-white/[0.035] to-white/[0.015] hover:border-gold/20"
  } ${interactive ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_16px_45px_rgba(0,0,0,0.22)] active:translate-y-[1px] active:scale-[0.99]" : ""}`;

  const content = (
    <>
      {interactive ? <span className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" /> : null}
      <div className="flex items-start justify-between gap-3">
        <p className="text-[8px] uppercase leading-4 tracking-[0.18em] text-gray-muted sm:text-[9px] sm:tracking-[0.25em]">
          {label}
        </p>
        {interactive ? <span className="text-[10px] text-white/20 transition-all group-hover:translate-x-0.5 group-hover:text-gold">↗</span> : null}
      </div>

      <p className="mt-2 text-2xl font-light tabular-nums text-white transition-colors group-hover:text-white sm:mt-3 sm:text-3xl">
        {value}
      </p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
