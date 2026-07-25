import Link from "next/link";

type ApplicationCardProps = {
  label: string;
  value: number;
  href?: string;
  description?: string;
  highlighted?: boolean;
};

function sanitizeValue(value: number) {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return Math.floor(value);
}

export default function ApplicationCard({
  label,
  value,
  href,
  description,
  highlighted = false,
}: ApplicationCardProps) {
  const safeValue = sanitizeValue(value);

  const classes = `group block min-w-0 rounded-[1.2rem] border p-3.5 transition duration-200 sm:rounded-[1.35rem] sm:p-4 ${
    highlighted
      ? "border-gold/30 bg-gold/[0.06]"
      : "border-white/10 bg-black/20"
  } ${
    href
      ? "hover:border-gold/40 hover:bg-white/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      : ""
  }`;

  const content = (
    <>
      <p className="arabic-safe truncate text-[9px] uppercase leading-5 tracking-[0.14em] text-white/35 sm:text-[10px] sm:tracking-[0.18em]">
        {label}
      </p>

      <p className="mt-1.5 break-words text-3xl font-light leading-none text-white sm:mt-2 sm:text-4xl">
        {safeValue}
      </p>

      {description ? (
        <p className="mt-1.5 line-clamp-2 text-[11px] leading-5 text-white/45 sm:mt-2 sm:text-xs">
          {description}
        </p>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label={`${label}: ${description ?? safeValue}`}
        className={classes}
      >
        {content}
      </Link>
    );
  }

  return <div className={classes}>{content}</div>;
}