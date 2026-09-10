"use client";

import { useEffect } from "react";

const SECTION_LABELS = {
  specialization: { ar: "نوع الموهبة", en: "Talent type" },
  identity: { ar: "البيانات الأساسية", en: "Basic information" },
  about: { ar: "نبذة", en: "Bio" },
  measurements: { ar: "المظهر والقياسات", en: "Appearance & measurements" },
  experience: { ar: "الخبرات", en: "Experience" },
  links: { ar: "معلومات مهنية إضافية", en: "Additional professional info" },
  privacy: { ar: "الخصوصية", en: "Privacy" },
} as const;

function isArabicPage() {
  return document.documentElement.lang === "ar" || document.documentElement.dir === "rtl";
}

function closestSectionTarget(fieldName: string) {
  const field = document.querySelector<HTMLElement>(`[name="${fieldName}"]`);
  if (!field) return null;
  return field.closest<HTMLElement>("section") ?? field.closest<HTMLElement>("div");
}

function ensureFieldAnchor(fieldName: string, id: string) {
  if (document.getElementById(id)) return;
  const target = closestSectionTarget(fieldName);
  if (!target) return;
  target.id = id;
  target.classList.add("scroll-mt-32");
}

function upsertNavLink(nav: HTMLElement, href: string, label: string, beforeHref?: string) {
  let link = nav.querySelector<HTMLAnchorElement>(`a[href="${href}"]`);
  if (!link) {
    link = document.createElement("a");
    link.href = href;
    link.className =
      "shrink-0 whitespace-nowrap rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-white/60 transition hover:border-gold/35 hover:text-gold";

    const before = beforeHref
      ? nav.querySelector<HTMLAnchorElement>(`a[href="${beforeHref}"]`)
      : null;
    if (before) nav.insertBefore(link, before);
    else nav.appendChild(link);
  }
  link.textContent = label;
}

function normalizeNavigation() {
  if (!window.location.pathname.includes("/talent-dashboard/profile")) return;

  const ar = isArabicPage();
  const specialization = document.querySelector<HTMLAnchorElement>('nav a[href="#specialization"]');
  const nav = specialization?.closest<HTMLElement>("nav");
  if (!nav) return;

  ensureFieldAnchor("skills", "skills");
  ensureFieldAnchor("languages", "languages");

  for (const [id, labels] of Object.entries(SECTION_LABELS)) {
    const link = nav.querySelector<HTMLAnchorElement>(`a[href="#${id}"]`);
    if (link) link.textContent = ar ? labels.ar : labels.en;
  }

  upsertNavLink(nav, "#skills", ar ? "المهارات" : "Skills", "#experience");
  upsertNavLink(nav, "#languages", ar ? "اللغات" : "Languages", "#experience");

  document.querySelectorAll<HTMLElement>("p").forEach((element) => {
    if (element.textContent?.trim() === "Talent Workspace") {
      element.textContent = "Talent Dashboard";
    }
  });
}

export function TalentProfileSectionNavigationV1() {
  useEffect(() => {
    if (!window.location.pathname.includes("/talent-dashboard/profile")) return;

    normalizeNavigation();
    const observer = new MutationObserver(normalizeNavigation);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
