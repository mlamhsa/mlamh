import type { ReactNode } from "react";

export function Badge({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${className}`}
    >
      {children}
    </span>
  );
}