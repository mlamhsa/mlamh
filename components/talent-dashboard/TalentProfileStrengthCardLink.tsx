"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function TalentProfileStrengthCardLink({ locale }: { locale: "ar" | "en" }) {
  const pathname = usePathname();
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    if (!pathname.endsWith("/talent-dashboard/profile")) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      // Scope the professional-details shortcut to the exact strength section only.
      // The old ancestor walk reached the page wrapper, whose text also contained
      // "قوِّ ملفك", so unrelated clicks such as the profile-photo picker were
      // incorrectly redirected to /profile/details on mobile.
      const section = target.closest("section");
      if (!section) return;

      const text = section.textContent?.replace(/\s+/g, " ").trim() ?? "";
      const isStrengthCard =
        (text.includes("قوِّ ملفك") && text.includes("قوة الملف")) ||
        (text.includes("Strengthen your profile") && text.includes("PROFILE STRENGTH"));

      if (!isStrengthCard) return;

      event.preventDefault();
      if (opening) return;
      setOpening(true);
      window.setTimeout(() => {
        window.location.assign(`/${locale}/talent-dashboard/profile/details`);
      }, 80);
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [locale, opening, pathname]);

  if (!opening) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 px-5 backdrop-blur-sm"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className="flex min-w-[250px] items-center justify-center gap-3 rounded-2xl border border-gold/25 bg-black/95 px-5 py-4 text-sm text-white shadow-2xl">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-gold/25 border-t-gold" />
        <span>{locale === "ar" ? "جارٍ فتح بياناتك المهنية..." : "Opening your professional details..."}</span>
      </div>
    </div>
  );
}
