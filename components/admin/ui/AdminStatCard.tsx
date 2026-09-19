import Link from "next/link";

export function AdminStatCard({
  label,
  value,
  href,
  active = false,
  hint,
}: {
  label: string;
  value: number | string;
  href?: string;
  active?: boolean;
  hint?: string;
}) {
  const className = `group relative overflow-hidden rounded-xl border p-4 transition-all duration-200 ${
    active
      ? "border-gold/28 bg-gold/[0.055]"
      : "border-white/[0.07] bg-white/[0.018] hover:border-white/[0.12] hover:bg-white/[0.028]"
  } ${href ? "hover:-translate-y-px" : ""}`;

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-medium leading-4 text-white/38">{label}</p>
        {href ? (
          <span className="text-[10px] text-white/18 transition group-hover:text-gold">↗</span>
        ) : null}
      </div>
      <p className={`mt-2 text-2xl font-semibold tabular-nums tracking-[-0.03em] ${
        active ? "text-gold" : "text-white/88"
      }`}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-[10px] leading-4 text-white/25">{hint}</p> : null}
    </>
  );

  return href ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}
