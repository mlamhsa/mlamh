"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function MarketingLiveRefresh({ intervalMs = 5000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    let active = true;
    const refresh = () => { if (active && document.visibilityState === "visible") router.refresh(); };
    const timer = window.setInterval(refresh, intervalMs);
    const onVisibility = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { active = false; window.clearInterval(timer); document.removeEventListener("visibilitychange", onVisibility); };
  }, [intervalMs, router]);
  return null;
}
