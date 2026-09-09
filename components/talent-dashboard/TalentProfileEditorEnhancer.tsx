"use client";

import { useEffect } from "react";
import { NATIONALITIES } from "@/lib/data/nationalities";

const PHYSICAL_MEASUREMENT_FIELDS = [
  "height_cm",
  "weight_kg",
  "shoe_size",
  "chest_size",
  "waist_size",
  "hip_size",
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

  if (notice.textContent !== message) {
    notice.textContent = message;
  }
}

function removeLegacyCountryNotice() {
  document.querySelectorAll<HTMLElement>("[data-mlamh-country-notice]").forEach((notice) => {
    notice.remove();
  });
}

function enhancePage() {
  const nationalitySelect = document.querySelector<HTMLSelectElement>(
    'select[name="nationality_slug"]',
  );
  if (nationalitySelect && nationalitySelect.dataset.globalNationalityOptions !== "1") {
    buildNationalityOptions(nationalitySelect);
  }

  // Residence/city is now multi-country and is preserved from signup. Never add
  // the legacy "Saudi market only" message to the profile editor.
  removeLegacyCountryNotice();
  updateDataQualityNotice();
}

export function TalentProfileEditorEnhancer() {
  useEffect(() => {
    if (!window.location.pathname.includes("/talent-dashboard/profile")) return;

    enhancePage();

    const handleInput = () => updateDataQualityNotice();
    document.addEventListener("input", handleInput, true);

    const observer = new MutationObserver(() => enhancePage());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener("input", handleInput, true);
      observer.disconnect();
    };
  }, []);

  return null;
}
