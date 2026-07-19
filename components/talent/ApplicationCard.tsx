"use client";

import Link from "next/link";

type ApplicationCardProps = {
  label: string;
  value: number;
  href?: string;
  description?: string;
  highlighted?: boolean;
};

export default function ApplicationCard({
  label,
  value,
  href,
  description,
  highlighted = false,
}: ApplicationCardProps) {
  const content = (
    <div
      className={`rounded-[1.5rem] border p-5 transition ${
        highlighted
          ? "border-gold/30 bg-gold/[0.06]"
          : "border-white/10 bg-black/20"
      } ${
        href
          ? "cursor-pointer hover:border-gold/40 hover:bg-white/[0.03]"
          : ""
      }`}
    >
      <p className="text-xs uppercase tracking-[0.22em] text-white/35">
        {label}
      </p>

      <p className="mt-3 text-4xl font-light text-white">
        {value}
      </p>

      {description ? (
        <p className="mt-3 text-sm text-white/45">
          {description}
        </p>
      ) : null}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}