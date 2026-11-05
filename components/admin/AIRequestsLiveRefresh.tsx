"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Refreshes the server-rendered admin inbox without reloading the page.
 * No browser-side access to support tickets or privileged Supabase credentials.
 */
export function AIRequestsLiveRefresh({ isArabic }: { isArabic: boolean }) {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const interval = window.setInterval(refresh, 10000);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [router]);

  return <p className="text-xs text-white/40" role="status">
    <span className="me-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
    {isArabic ? "تحديث تلقائي كل 10 ثوانٍ" : "Auto-refresh every 10 seconds"}
  </p>;
}
