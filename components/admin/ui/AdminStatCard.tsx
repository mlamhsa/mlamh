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
  const className = `rounded-2xl border p-4 transition sm:rounded-3xl sm:p-5 ${
    active
      ? "border-gold/40 bg-gold/[0.06]"
      : "border-white/[0.08] bg-gray-elevated/30 hover:border-gold/20"
  }`;

  const content = (
    <>
      <p className="text-[8px] uppercase leading-4 tracking-[0.18em] text-gray-muted sm:text-[9px] sm:tracking-[0.25em]">
        {label}
      </p>

      <p className="mt-2 text-2xl font-light text-white sm:mt-3 sm:text-3xl">
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
