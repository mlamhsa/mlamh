"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function TalentProfileStrengthCardLink({ locale }: { locale: "ar" | "en" }) {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname.endsWith("/talent-dashboard/profile")) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      let current: Element | null = target;
      while (current && current !== document.body) {
        const text = current.textContent?.replace(/\s+/g, " ").trim() ?? "";
        const isStrengthCard =
          (text.includes("قوِّ ملفك") && text.includes("قوة الملف")) ||
          (text.includes("Strengthen your profile") && text.includes("PROFILE STRENGTH"));

        if (isStrengthCard) {
          event.preventDefault();
          // Use a full navigation here so the authenticated session cookies are
          // read fresh by the professional-details route and its server actions.
          window.location.assign(`/${locale}/talent-dashboard/profile/details`);
          return;
        }

        current = current.parentElement;
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [locale, pathname]);

  return null;
}
