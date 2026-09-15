"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TalentAdvancedSectionRouter({ locale }: { locale: string }) {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;

    if (hash === "#privacy" || hash === "#profile_visibility") {
      router.replace(`/${locale}/talent-dashboard/profile/privacy`);
      return;
    }

    if (hash === "#identity" || !hash) {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      });
    }
  }, [locale, router]);

  return null;
}
