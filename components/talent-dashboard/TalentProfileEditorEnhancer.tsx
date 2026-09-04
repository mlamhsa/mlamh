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

function ensureCountryNotice(citySelect: HTMLSelectElement) {
  const field = citySelect.parentElement;
  if (!field || field.querySelector("[data-mlamh-country-notice]")) return;

  const ar = isArabicPage();
  const notice = document.createElement("div");
  notice.dataset.mlamhCountryNotice = "1";
  notice.className =
    "mb-4 rounded-2xl border border-gold/20 bg-gold/[0.045] px-4 py-3";
  notice.innerHTML = ar
    ? '<div class="flex items-center justify-between gap-3"><span class="text-sm text-white">الدولة: السعودية</span><span class="rounded-full border border-gold/20 bg-gold/[0.08] px-2.5 py-1 text-[10px] text-gold">السوق الحالي</span></div><p class="mt-2 text-xs leading-5 text-white/40">تظهر المدن السعودية فقط حاليًا. الجنسية مستقلة ويمكن اختيارها من جميع دول العالم.</p>'
    : '<div class="flex items-center justify-between gap-3"><span class="text-sm text-white">Country: Saudi Arabia</span><span class="rounded-full border border-gold/20 bg-gold/[0.08] px-2.5 py-1 text-[10px] text-gold">Current market</span></div><p class="mt-2 text-xs leading-5 text-white/40">Only Saudi cities are available for the current market. Nationality is independent and supports all countries.</p>';

  field.prepend(notice);
}

function updateDataQualityNotice() {
  const section = document.getElementById("measurements");
  if (!section) return;

  const ar = isArabicPage();
  const invalidFields: string[] = [];

  for (const fieldName of PHYSICAL_MEASUREMENT_FIELDS) {
    const input = document.querySelector<HTMLInputElement>(`input[name="${fieldName}"]`);
    if (!input) continue;

    input.min = "0.1";
    input.step = "any";

    const raw = input.value.trim();
    const numericValue = raw ? Number(raw) : null;
    const invalid = numericValue !== null && Number.isFinite(numericValue) && numericValue <= 0;

    input.setAttribute("aria-invalid", invalid ? "true" : "false");
    if (invalid) invalidFields.push(fieldName);
  }

  let notice = section.querySelector<HTMLElement>("[data-mlamh-data-quality-notice]");

  if (invalidFields.length === 0) {
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

  notice.textContent = ar
    ? "توجد قيمة قياس صفرية أو سالبة في ملفك. راجع القياسات وصححها حتى تكون بيانات الملف دقيقة."
    : "Your profile contains a zero or negative measurement. Review and correct the measurements so your profile data stays accurate.";
}

function enhancePage() {
  const nationalitySelect = document.querySelector<HTMLSelectElement>(
    'select[name="nationality_slug"]',
  );
  if (nationalitySelect && nationalitySelect.dataset.globalNationalityOptions !== "1") {
    buildNationalityOptions(nationalitySelect);
  }

  const citySelect = document.querySelector<HTMLSelectElement>('select[name="city_slug"]');
  if (citySelect) ensureCountryNotice(citySelect);

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
