"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { TalentRoleSelectorV1 } from "@/components/talent-dashboard/TalentRoleSelectorV1";
import { TalentVisibilitySelectorV1 } from "@/components/talent-dashboard/TalentVisibilitySelectorV1";
import { NATIONALITIES } from "@/lib/data/nationalities";

const PHYSICAL_MEASUREMENT_FIELDS = [
  "height_cm",
  "weight_kg",
  "shoe_size",
  "chest_size",
  "waist_size",
  "hip_size",
] as const;

const REQUIRED_FIELD_NAMES = [
  "name_ar",
  "name_en",
  "phone",
  "city_slug",
  "gender",
  "nationality_slug",
  "date_of_birth",
] as const;

function isArabicPage() {
  return document.documentElement.lang === "ar" || document.documentElement.dir === "rtl";
}

function buildNationalityOptions(select: HTMLSelectElement) {
  const ar = isArabicPage();
  const currentValue = select.value;
  const currentOptionLabel =
    Array.from(select.options).find((option) => option.value === currentValue)?.textContent?.trim() ||
    currentValue;

  const fragment = document.createDocumentFragment();
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = ar ? "اختر الجنسية" : "Select nationality";
  fragment.appendChild(placeholder);

  const sorted = [...NATIONALITIES].sort((a, b) =>
    (ar ? a.ar : a.en).localeCompare(ar ? b.ar : b.en, ar ? "ar" : "en"),
  );

  for (const nationality of sorted) {
    const option = document.createElement("option");
    option.value = nationality.slug;
    option.textContent = ar
      ? `${nationality.ar} — ${nationality.countryAr}`
      : `${nationality.en} — ${nationality.countryEn}`;
    fragment.appendChild(option);
  }

  if (
    currentValue &&
    !NATIONALITIES.some((nationality) => nationality.slug === currentValue)
  ) {
    const legacyOption = document.createElement("option");
    legacyOption.value = currentValue;
    legacyOption.textContent = ar
      ? `القيمة الحالية: ${currentOptionLabel}`
      : `Current value: ${currentOptionLabel}`;
    fragment.appendChild(legacyOption);
  }

  select.replaceChildren(fragment);
  select.value = currentValue;
  select.dataset.globalNationalityOptions = "1";
}

function updateDataQualityNotice() {
  const section = document.getElementById("measurements");
  if (!section) return;

  const ar = isArabicPage();
  let hasInvalidMeasurement = false;

  for (const fieldName of PHYSICAL_MEASUREMENT_FIELDS) {
    const input = document.querySelector<HTMLInputElement>(`input[name="${fieldName}"]`);
    if (!input) continue;

    input.min = "0.1";
    input.step = "any";

    const raw = input.value.trim();
    const numericValue = raw ? Number(raw) : null;
    const invalid = numericValue !== null && Number.isFinite(numericValue) && numericValue <= 0;

    input.setAttribute("aria-invalid", invalid ? "true" : "false");
    if (invalid) hasInvalidMeasurement = true;
  }

  let notice = section.querySelector<HTMLElement>("[data-mlamh-data-quality-notice]");

  if (!hasInvalidMeasurement) {
    notice?.remove();
    return;
  }

  if (!notice) {
    notice = document.createElement("div");
    notice.dataset.mlamhDataQualityNotice = "1";
    notice.className =
      "mb-4 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-sm text-amber-100";
    section.prepend(notice);
  }

  const message = ar
    ? "توجد قيمة قياس صفرية أو سالبة في ملفك. راجع القياسات وصححها حتى تكون بيانات الملف دقيقة."
    : "Your profile contains a zero or negative measurement. Review and correct the measurements so your profile data stays accurate.";

  if (notice.textContent !== message) notice.textContent = message;
}

function removeLegacyCountryNotice() {
  document.querySelectorAll<HTMLElement>("[data-mlamh-country-notice]").forEach((notice) => {
    notice.remove();
  });
}

function prepareRoleSelectorPortal() {
  const section = document.getElementById("specialization");
  if (!section) return null;

  let portal = section.querySelector<HTMLElement>("[data-mlamh-role-selector-v1]");

  if (!portal) {
    portal = document.createElement("div");
    portal.dataset.mlamhRoleSelectorV1 = "1";
    section.prepend(portal);
  }

  Array.from(section.children).forEach((child) => {
    if (child === portal) return;
    if (child instanceof HTMLElement) {
      child.hidden = true;
      child.dataset.legacyRoleSelector = "1";
    }
  });

  return portal;
}

function preparePrivacyPortal() {
  const anchor = document.getElementById("links") ?? document.getElementById("experience");
  if (!anchor?.parentElement) return null;

  let portal = anchor.parentElement.querySelector<HTMLElement>("[data-mlamh-privacy-selector-v1]");
  if (!portal) {
    portal = document.createElement("div");
    portal.dataset.mlamhPrivacySelectorV1 = "1";
    portal.className = "mt-6";
    anchor.insertAdjacentElement("afterend", portal);
  }

  return portal;
}

function ensureSectionNavigation() {
  const specialization = document.getElementById("specialization");
  if (!specialization?.parentElement) return;
  if (specialization.parentElement.querySelector("[data-mlamh-profile-section-nav]")) return;

  const ar = isArabicPage();
  const definitions = [
    ["identity", ar ? "البيانات الأساسية" : "Basic information"],
    ["specialization", ar ? "نوع الموهبة" : "Talent type"],
    ["about", ar ? "النبذة" : "About"],
    ["measurements", ar ? "المظهر والقياسات" : "Appearance & measurements"],
    ["experience", ar ? "الخبرة" : "Experience"],
    ["links", ar ? "روابط مهنية" : "Professional links"],
    ["privacy", ar ? "الخصوصية" : "Privacy"],
  ] as const;

  const nav = document.createElement("nav");
  nav.dataset.mlamhProfileSectionNav = "1";
  nav.setAttribute("aria-label", ar ? "أقسام الملف المهني" : "Professional profile sections");
  nav.className = "mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-black/30 p-2 [scrollbar-width:none]";

  for (const [id, label] of definitions) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.className = "shrink-0 rounded-xl border border-white/10 px-4 py-2.5 text-xs text-white/60 transition hover:border-gold/35 hover:bg-gold/[0.06] hover:text-gold";
    button.addEventListener("click", () => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    nav.appendChild(button);
  }

  specialization.parentElement.insertBefore(nav, specialization);
}

function markRequiredFields() {
  const ar = isArabicPage();

  for (const name of REQUIRED_FIELD_NAMES) {
    const field = document.querySelector<HTMLElement>(`[name="${name}"]`);
    if (!field) continue;

    const label = field.closest("label");
    if (!label || label.querySelector("[data-mlamh-required-star]")) continue;

    const labelText = label.querySelector<HTMLElement>("span");
    if (!labelText) continue;

    const star = document.createElement("span");
    star.dataset.mlamhRequiredStar = "1";
    star.className = "ms-1 text-gold";
    star.textContent = " ⭐";
    star.title = ar ? "مطلوب للاعتماد" : "Required for approval";
    labelText.appendChild(star);
  }
}

function enhancePage() {
  const nationalitySelect = document.querySelector<HTMLSelectElement>(
    'select[name="nationality_slug"]',
  );
  if (nationalitySelect && nationalitySelect.dataset.globalNationalityOptions !== "1") {
    buildNationalityOptions(nationalitySelect);
  }

  removeLegacyCountryNotice();
  updateDataQualityNotice();
  markRequiredFields();

  const rolePortal = prepareRoleSelectorPortal();
  const privacyPortal = preparePrivacyPortal();
  ensureSectionNavigation();

  return { rolePortal, privacyPortal };
}

export function TalentProfileEditorEnhancer() {
  const [rolePortal, setRolePortal] = useState<HTMLElement | null>(null);
  const [privacyPortal, setPrivacyPortal] = useState<HTMLElement | null>(null);
  const [locale, setLocale] = useState<"ar" | "en">("ar");

  useEffect(() => {
    if (!window.location.pathname.includes("/talent-dashboard/profile")) return;

    setLocale(isArabicPage() ? "ar" : "en");
    const initial = enhancePage();
    setRolePortal(initial.rolePortal);
    setPrivacyPortal(initial.privacyPortal);

    const handleInput = () => updateDataQualityNotice();
    document.addEventListener("input", handleInput, true);

    const observer = new MutationObserver(() => {
      const next = enhancePage();
      if (next.rolePortal) setRolePortal((current) => current ?? next.rolePortal);
      if (next.privacyPortal) setPrivacyPortal((current) => current ?? next.privacyPortal);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener("input", handleInput, true);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      {rolePortal
        ? createPortal(<TalentRoleSelectorV1 locale={locale} />, rolePortal)
        : null}
      {privacyPortal
        ? createPortal(<TalentVisibilitySelectorV1 locale={locale} />, privacyPortal)
        : null}
    </>
  );
}
