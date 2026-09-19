import type { ReactNode } from "react";

export function AdminCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative rounded-2xl border border-white/[0.075] bg-white/[0.022] shadow-[0_14px_45px_rgba(0,0,0,0.16)] ring-1 ring-inset ring-white/[0.012] transition-[border-color,box-shadow,background-color] duration-200 hover:border-white/[0.12] hover:bg-white/[0.028] ${className}`}
    >
      {children}
    </div>
  );
}
