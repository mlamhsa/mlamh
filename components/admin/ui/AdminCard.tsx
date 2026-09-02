import type { ReactNode } from "react";

export function AdminCard({ children, className = "" }: { children: ReactNode; className?: string; }) {
  return (
    <div
      className={`relative rounded-[1.5rem] border border-white/[0.09] bg-gradient-to-b from-white/[0.045] to-white/[0.022] shadow-[0_18px_55px_rgba(0,0,0,0.18)] ring-1 ring-inset ring-white/[0.015] transition-[border-color,box-shadow,transform,background-color] duration-200 hover:border-white/[0.14] hover:shadow-[0_22px_70px_rgba(0,0,0,0.24)] ${className}`}
    >
      {children}
    </div>
  );
}
