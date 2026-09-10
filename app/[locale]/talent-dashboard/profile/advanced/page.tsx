"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TalentAdvancedProfileRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const router = useRouter();
  const resolvedLocale = locale === "en" ? "en" : "ar";

  useEffect(() => {
    const hash = window.location.hash;
    router.replace(`/${resolvedLocale}/talent-dashboard/profile/details${hash}`);
  }, [resolvedLocale, router]);

  return (
    <main
      className="min-h-screen bg-background px-4 pb-24 pt-40 text-white"
      dir={resolvedLocale === "ar" ? "rtl" : "ltr"}
    >
      <div className="mx-auto max-w-xl text-center text-sm text-white/50">
        {resolvedLocale === "ar" ? "جارٍ فتح الحقل المطلوب..." : "Opening the required field..."}
      </div>
    </main>
  );
}
