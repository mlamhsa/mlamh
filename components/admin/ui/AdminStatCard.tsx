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
  const className = `rounded-3xl border p-5 transition ${
    active
      ? "border-gold/40 bg-gold/[0.06]"
      : "border-white/[0.08] bg-gray-elevated/30 hover:border-gold/20"
  }`;

  const content = (
    <>
      <p className="text-[9px] uppercase tracking-[0.25em] text-gray-muted">
        {label}
      </p>

      <p className="mt-3 text-3xl font-light text-white">{value}</p>
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