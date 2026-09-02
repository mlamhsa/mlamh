"use client";

import { useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

export function TaskLiveRefresh({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!enabled) return;
    const interval = window.setInterval(() => { if (document.visibilityState === "visible") router.refresh(); }, 3000);
    return () => window.clearInterval(interval);
  }, [enabled, router]);
  return null;
}

export function RunNextTaskButton({ isArabic }: { isArabic: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className="group relative inline-flex min-h-11 items-center justify-center overflow-hidden rounded-xl border border-gold/35 bg-gold/[0.08] px-5 py-2.5 text-sm font-medium text-gold shadow-[0_10px_30px_rgba(212,175,55,0.06)] outline-none transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/55 hover:bg-gold/[0.14] hover:shadow-[0_14px_38px_rgba(212,175,55,0.12)] active:translate-y-[1px] active:scale-[0.985] disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-60">
      <span className="pointer-events-none absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent transition-transform duration-500 group-hover:translate-x-[120%]" />
      <span className="relative flex items-center gap-2">{pending&&<span className="h-2 w-2 animate-pulse rounded-full bg-gold"/>}{pending?(isArabic?"Marketing AI يعمل الآن...":"Marketing AI is working..."):(isArabic?"تشغيل المهمة التالية":"Run next AI task")}</span>
    </button>
  );
}
