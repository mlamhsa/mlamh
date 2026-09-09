"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { TalentResidenceCountrySelectorV1 } from "@/components/talent-dashboard/TalentResidenceCountrySelectorV1";
import { TalentRoleSelectorV1 } from "@/components/talent-dashboard/TalentRoleSelectorV1";
import { TalentVisibilitySelectorV1 } from "@/components/talent-dashboard/TalentVisibilitySelectorV1";
import {
  getOwnTalentResidenceAction,
  type OwnTalentResidence,
} from "@/lib/actions/get-own-talent-residence";
import { NATIONALITIES } from "@/lib/data/nationalities";
import { TALENT_SIGNUP_COUNTRIES } from "@/lib/data/talent-signup";

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

function normalizeProfileCopy() {
  if (isArabicPage()) return;

  document.querySelectorAll<HTMLElement>("p").forEach((element) => {
    if (element.textContent?.trim() === "Talent Workspace") {
      element.textContent = "Talent Dashboard";
    }
  });
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

function ensureResidenceCountryContext(
  citySelect: HTMLSelectElement,
  residence: OwnTalentResidence,
) {
  const fieldContainer = citySelect.closest("label") ?? citySelect.parentElement;
  if (!fieldContainer) return;

  const ar = isArabicPage();
  let notice = fieldContainer.querySelector<HTMLElement>(
    "[data-mlamh-residence-country-context]",
  );

  if (!notice) {
    notice = document.createElement("div");
    notice.dataset.mlamhResidenceCountryContext = "1";
    notice.className =
      "mb-3 rounded-xl border border-gold/15 bg-gold/[0.04] px-3 py-2.5 text-xs leading-5 text-white/45";
    citySelect.insertAdjacentElement("beforebegin", notice);
  }

  if (!residence.countryCode) {
    notice.className =
      "mb-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-3 py-2.5 text-xs leading-5 text-amber-100";
    notice.textContent = ar
      ? "اختر بلد الإقامة أولًا حتى تظهر قائمة المدن الصحيحة."
      : "Choose your country of residence first so the correct city list can be shown.";
    citySelect.disabled = true;
    return;
  }

  const country = TALENT_SIGNUP_COUNTRIES.find(
    (item) => item.code === residence.countryCode,
  );
  if (!country) return;

  notice.className =
    "mb-3 rounded-xl border border-gold/15 bg-gold/[0.04] px-3 py-2.5 text-xs leading-5 text-white/45";
  notice.textContent = ar
    ? `بلد الإقامة: ${country.ar} — تظهر المدن التابعة لبلد إقامتك المسجل.`
    : `Country of residence: ${country.en} — cities are shown for your saved residence country.`;
  citySelect.disabled = false;
}

function buildCountryAwareCityOptions(
  select: HTMLSelectElement,
  residence: OwnTalentResidence,
) {
  ensureResidenceCountryContext(select, residence);
  if (!residence.countryCode) return;

  const country = TALENT_SIGNUP_COUNTRIES.find(
    (item) => item.code === residence.countryCode,
  );
  if (!country) return;

  const ar = isArabicPage();
  const currentValue = select.value || residence.citySlug;
  const expectedValues = ["", ...country.cities.map((city) => city.value)];
  const hasKnownCurrent = !currentValue || expectedValues.includes(currentValue);
  if (currentValue && !hasKnownCurrent) expectedValues.push(currentValue);

  const actualValues = Array.from(select.options).map((option) => option.value);
  const optionsMatch =
    actualValues.length === expectedValues.length &&
    actualValues.every((value, index) => value === expectedValues[index]);

  if (!optionsMatch) {
    const fragment = document.createDocumentFragment();
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = ar ? "اختر المدينة" : "Select city";
    fragment.appendChild(placeholder);

    for (const city of country.cities) {
      const option = document.createElement("option");
      option.value = city.value;
      option.textContent = ar ? city.ar : city.en;
      fragment.appendChild(option);
    }

    if (currentValue && !country.cities.some((city) => city.value === currentValue)) {
      const legacyOption = document.createElement("option");
      legacyOption.value = currentValue;
      const savedLabel = ar ? residence.cityAr : residence.cityEn;
      legacyOption.textContent = savedLabel || currentValue.replaceAll("_", " ");
      fragment.appendChild(legacyOption);
    }

    select.replaceChildren(fragment);
    select.value = currentValue;
  }

  select.dataset.mlamhResidenceCountry = residence.countryCode;
}

function prepareResidenceCountryPortal(citySelect: HTMLSelectElement) {
  const fieldContainer = citySelect.closest("label") ?? citySelect.parentElement;
  if (!fieldContainer?.parentElement) return null;

  let portal = fieldContainer.parentElement.querySelector<HTMLElement>(
    "[data-mlamh-residence-country-selector-v1]",
  );

  if (!portal) {
    portal = document.createElement("div");
    portal.dataset.mlamhResidenceCountrySelectorV1 = "1";
    fieldContainer.insertAdjacentElement("beforebegin", portal);
  }

  return portal;
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

function ensurePrivacyNavLink() {
  if (document.querySelector('[data-mlamh-privacy-nav-link="1"]')) return;

  const specializationLink = document.querySelector<HTMLAnchorElement>('nav a[href="#specialization"]');
  const nav = specializationLink?.closest("nav");
  if (!nav) return;

  const link = document.createElement("a");
  link.href = "#privacy";
  link.dataset.mlamhPrivacyNavLink = "1";
  link.textContent = isArabicPage() ? "الخصوصية" : "Privacy";
  link.className =
    "shrink-0 whitespace-nowrap rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-white/60 transition hover:border-gold/35 hover:text-gold";
  nav.appendChild(link);
}

function markRequiredFields() {
  const ar = isArabicPage();

  for (const name of REQUIRED_FIELD_NAMES) {
    const field = document.querySelector<HTMLElement>(`[name="${name}"]`);
    if (!field) continue;

    const label = field.closest("label") ?? document.querySelector<HTMLLabelElement>(`label[for="${field.id}"]`);
    if (!label || label.querySelector("[data-mlamh-required-star]")) continue;

    const labelText = label.querySelector<HTMLElement>("span") ?? label;
    const normalized = labelText.textContent ?? "";
    if (normalized.includes("⭐")) continue;

    const star = document.createElement("span");
    star.dataset.mlamhRequiredStar = "1";
    star.className = "ms-1 text-gold";
    star.textContent = " ⭐";
    star.title = ar ? "مطلوب للاعتماد" : "Required for approval";
    labelText.appendChild(star);
  }
}

function enhancePage(residence: OwnTalentResidence | null) {
  normalizeProfileCopy();

  const nationalitySelect = document.querySelector<HTMLSelectElement>(
    'select[name="nationality_slug"]',
  );
  if (nationalitySelect && nationalitySelect.dataset.globalNationalityOptions !== "1") {
    buildNationalityOptions(nationalitySelect);
  }

  const citySelect = document.querySelector<HTMLSelectElement>('select[name="city_slug"]');
  const residencePortal = citySelect ? prepareResidenceCountryPortal(citySelect) : null;
  if (citySelect && residence) {
    buildCountryAwareCityOptions(citySelect, residence);
  }

  removeLegacyCountryNotice();
  updateDataQualityNotice();
  markRequiredFields();

  const rolePortal = prepareRoleSelectorPortal();
  const privacyPortal = preparePrivacyPortal();
  ensurePrivacyNavLink();

  return { rolePortal, privacyPortal, residencePortal };
}

export function TalentProfileEditorEnhancer() {
  const [rolePortal, setRolePortal] = useState<HTMLElement | null>(null);
  const [privacyPortal, setPrivacyPortal] = useState<HTMLElement | null>(null);
  const [residencePortal, setResidencePortal] = useState<HTMLElement | null>(null);
  const [locale, setLocale] = useState<"ar" | "en">("ar");
  const [residence, setResidence] = useState<OwnTalentResidence | null>(null);

  useEffect(() => {
    if (!window.location.pathname.includes("/talent-dashboard/profile")) return;

    let active = true;
    setLocale(isArabicPage() ? "ar" : "en");

    void getOwnTalentResidenceAction().then((value) => {
      if (active) setResidence(value);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!window.location.pathname.includes("/talent-dashboard/profile")) return;

    const initial = enhancePage(residence);
    setRolePortal(initial.rolePortal);
    setPrivacyPortal(initial.privacyPortal);
    setResidencePortal(initial.residencePortal);

    const handleInput = () => updateDataQualityNotice();
    document.addEventListener("input", handleInput, true);

    const observer = new MutationObserver(() => {
      const next = enhancePage(residence);
      if (next.rolePortal) setRolePortal((current) => current ?? next.rolePortal);
      if (next.privacyPortal) setPrivacyPortal((current) => current ?? next.privacyPortal);
      if (next.residencePortal) {
        setResidencePortal((current) => current ?? next.residencePortal);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener("input", handleInput, true);
      observer.disconnect();
    };
  }, [residence]);

  return (
    <>
      {rolePortal
        ? createPortal(<TalentRoleSelectorV1 locale={locale} />, rolePortal)
        : null}
      {residencePortal && residence
        ? createPortal(
            <TalentResidenceCountrySelectorV1
              locale={locale}
              currentCountryCode={residence.countryCode}
            />,
            residencePortal,
          )
        : null}
      {privacyPortal
        ? createPortal(<TalentVisibilitySelectorV1 locale={locale} />, privacyPortal)
        : null}
    </>
  );
}
