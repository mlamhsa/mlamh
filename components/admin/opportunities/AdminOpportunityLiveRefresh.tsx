"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminOpportunityLiveRefresh() {
  const router = useRouter();

  useEffect(() => {
    const interval = window.setInterval(() => {
      router.refresh();
    }, 10000);

    return () => {
      window.clearInterval(interval);
    };
  }, [router]);

  return null;
}