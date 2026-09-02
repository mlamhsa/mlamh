"use client";

import { useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

export function TaskLiveRefresh({ enabled }: { enabled: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    const interval = window.setInterval(() => {
      router.refresh();
    }, 3000);

    return () => window.clearInterval(interval);
  }, [enabled, router]);

  return null;
}

export function RunNextTaskButton({ isArabic }: { isArabic: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl border border-gold/40 bg-gold/10 px-5 py-2.5 text-sm text-gold transition hover:bg-gold hover:text-black disabled:cursor-wait disabled:opacity-60"
    >
      {pending
        ? isArabic
          ? "جاري التحليل..."
          : "AI is working..."
        : isArabic
          ? "تشغيل المهمة التالية"
          : "Run next AI task"}
    </button>
  );
}
