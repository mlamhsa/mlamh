"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

function textOf(element: Element | null) {
  return element?.textContent?.replace(/\s+/g, " ").trim() ?? "";
}

export function TalentProfileGuidedUxEnhancer({ locale }: { locale: string }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!pathname.includes("/talent-dashboard/profile")) return;

    let disposed = false;
    const cleanups: Array<() => void> = [];

    const enhance = () => {
      if (disposed) return;

      const datePickerHost = document.querySelector<HTMLElement>("[data-mlamh-dob-picker='1']");
      const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("button"));

      for (const button of buttons) {
        if (button.dataset.mlamhGuidedAction === "1") continue;
        const label = textOf(button);
        const isDateRequirement = label.includes("تاريخ الميلاد") || label.includes("Date of birth");
        const isNextStep = label === "أكمل الخطوة التالية" || label === "Complete next step";

        if (!isDateRequirement && !isNextStep) continue;

        const onClick = () => {
          window.setTimeout(() => {
            const host = document.querySelector<HTMLElement>("[data-mlamh-dob-picker='1']");
            if (!host) return;

            if (isNextStep) {
              const remainingSection = Array.from(document.querySelectorAll<HTMLElement>("section")).find((section) => {
                const sectionText = textOf(section);
                return sectionText.includes("أكمل المطلوب فقط") || sectionText.includes("Complete only what's required");
              });
              const firstRequirement = remainingSection?.querySelector<HTMLButtonElement>("button");
              const firstRequirementText = textOf(firstRequirement);
              const dateIsFirst = firstRequirementText.includes("تاريخ الميلاد") || firstRequirementText.includes("Date of birth");
              if (!dateIsFirst) return;
            }

            host.scrollIntoView({ behavior: "smooth", block: "center" });
            const firstFocusable = host.querySelector<HTMLElement>("button, select, input, [tabindex]:not([tabindex='-1'])");
            window.setTimeout(() => firstFocusable?.focus(), 350);
          }, 0);
        };

        button.dataset.mlamhGuidedAction = "1";
        button.addEventListener("click", onClick);
        cleanups.push(() => button.removeEventListener("click", onClick));
      }

      const strengthLabels = Array.from(document.querySelectorAll<HTMLElement>("p")).filter((element) => {
        const label = textOf(element);
        return label === "قوة الملف" || label === "PROFILE STRENGTH";
      });

      for (const label of strengthLabels) {
        const card = label.closest<HTMLElement>("div.rounded-\\[2rem\\]");
        if (!card || card.dataset.mlamhStrengthCard === "1") continue;
        const cardText = textOf(card);
        if (!cardText.includes("قوِّ ملفك") && !cardText.includes("Strengthen your profile")) continue;

        card.dataset.mlamhStrengthCard = "1";
        card.setAttribute("role", "link");
        card.setAttribute("tabindex", "0");
        card.setAttribute("aria-label", locale === "ar" ? "فتح تعديل بيانات الملف المهني" : "Open professional profile editing");
        card.classList.add("cursor-pointer", "transition", "hover:border-gold/35", "hover:bg-white/[0.035]");

        const openEditor = () => router.push(`/${locale}/talent-dashboard/profile/advanced`);
        const onKeyDown = (event: KeyboardEvent) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          openEditor();
        };

        card.addEventListener("click", openEditor);
        card.addEventListener("keydown", onKeyDown);
        cleanups.push(() => {
          card.removeEventListener("click", openEditor);
          card.removeEventListener("keydown", onKeyDown);
        });
      }

      void datePickerHost;
    };

    enhance();
    const observer = new MutationObserver(enhance);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      disposed = true;
      observer.disconnect();
      for (const cleanup of cleanups) cleanup();
    };
  }, [locale, pathname, router]);

  return null;
}
