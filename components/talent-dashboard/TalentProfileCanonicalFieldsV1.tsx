"use client";

import { useEffect } from "react";

import { GENDER_OPTIONS, TALENT_SIGNUP_COUNTRIES } from "@/lib/data/talent-signup";

function isArabicPage() {
  return document.documentElement.lang === "ar" || document.documentElement.dir === "rtl";
}

function normalizeGenderSelect() {
  const select = document.querySelector<HTMLSelectElement>('select[name="gender"]');
  if (!select || select.dataset.mlamhCanonicalGender === "1") return;

  const isArabic = isArabicPage();
  const currentValue = select.value;
  const currentLabel =
    Array.from(select.options).find((option) => option.value === currentValue)?.textContent?.trim() ||
    currentValue;

  const fragment = document.createDocumentFragment();
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = isArabic ? "اختر الجنس" : "Select gender";
  fragment.appendChild(placeholder);

  for (const option of GENDER_OPTIONS) {
    const element = document.createElement("option");
    element.value = option.value;
    element.textContent = isArabic ? option.ar : option.en;
    fragment.appendChild(element);
  }

  if (currentValue && !GENDER_OPTIONS.some((option) => option.value === currentValue)) {
    const legacy = document.createElement("option");
    legacy.value = currentValue;
    legacy.textContent = isArabic
      ? `القيمة الحالية: ${currentLabel}`
      : `Current value: ${currentLabel}`;
    fragment.appendChild(legacy);
  }

  select.replaceChildren(fragment);
  select.value = currentValue;
  select.dataset.mlamhCanonicalGender = "1";
}

function normalizeNameRequirementHint() {
  const fields = ["name_ar", "name_en"] as const;
  const labels: HTMLElement[] = [];

  for (const name of fields) {
    const field = document.querySelector<HTMLElement>(`[name="${name}"]`);
    const label = field?.closest<HTMLElement>("label") ?? null;
    if (!label) continue;

    label.querySelectorAll<HTMLElement>("[data-mlamh-required-star]").forEach((star) => star.remove());
    labels.push(label);
  }

  const identity = document.getElementById("identity");
  if (!identity || labels.length === 0 || identity.querySelector("[data-mlamh-name-requirement-hint]")) return;

  const hint = document.createElement("div");
  hint.dataset.mlamhNameRequirementHint = "1";
  hint.className =
    "mb-4 rounded-2xl border border-gold/15 bg-gold/[0.04] px-4 py-3 text-xs leading-6 text-white/50";
  hint.textContent = isArabicPage()
    ? "⭐ الاسم مطلوب للاعتماد، ويكفي توفر الاسم الصحيح في أحد حقلي العربية أو الإنجليزية."
    : "⭐ A name is required for approval. A valid Arabic or English name is sufficient.";
  identity.prepend(hint);
}

function markProfileImageRequired() {
  const imageInput = document.querySelector<HTMLElement>('[name="image_url"]');
  if (!imageInput) return;

  const container = imageInput.closest<HTMLElement>("label") ?? imageInput.parentElement;
  if (!container) return;

  if (!container.id) container.id = "profile-image";
  container.classList.add("scroll-mt-28");

  if (container.querySelector("[data-mlamh-image-required-hint]")) return;

  const hint = document.createElement("p");
  hint.dataset.mlamhImageRequiredHint = "1";
  hint.className = "mt-2 text-xs text-gold";
  hint.textContent = isArabicPage()
    ? "⭐ الصورة الشخصية الواضحة مطلوبة للاعتماد."
    : "⭐ A clear profile photo is required for approval.";
  container.appendChild(hint);
}

function normalizeDateOfBirthField() {
  const input = document.querySelector<HTMLInputElement>('input[name="date_of_birth"]');
  if (!input) return;

  const container = input.closest<HTMLElement>("label") ?? input.parentElement;
  if (container && !container.id) {
    container.id = "date-of-birth";
    container.classList.add("scroll-mt-28");
  }

  input.lang = "en-CA";
  input.dir = "ltr";
  input.inputMode = "numeric";
  input.max = new Date().toISOString().slice(0, 10);
  input.title = isArabicPage()
    ? "أدخل تاريخ الميلاد بالميلادي"
    : "Enter your date of birth using the Gregorian calendar";
}

function normalizeResidenceCountrySelect() {
  const select = document.querySelector<HTMLSelectElement>('select[name="base_country_code"]');
  if (!select || select.dataset.mlamhSaudiResidenceOnly === "1") return;

  const sa = TALENT_SIGNUP_COUNTRIES.find((item) => item.code === "SA");
  if (!sa) return;

  const option = document.createElement("option");
  option.value = "SA";
  option.textContent = isArabicPage() ? sa.ar : sa.en;
  select.replaceChildren(option);
  select.value = "SA";
  select.dataset.mlamhSaudiResidenceOnly = "1";
  select.title = isArabicPage()
    ? "ملامح متاحة حاليًا للمقيمين في السعودية"
    : "MLAMH is currently available to residents of Saudi Arabia";
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

function findPhoneField() {
  const named = document.querySelector<HTMLInputElement>(
    'input[name="phone"], input[name="mobile"], input[name="whatsapp"]',
  );
  if (named) return named;

  return Array.from(document.querySelectorAll<HTMLInputElement>('input[type="text"], input[type="tel"], input:not([type])'))
    .find((input) => {
      const label = input.closest("label")?.textContent ?? input.parentElement?.parentElement?.textContent ?? "";
      return label.includes("رقم الجوال") || label.toLowerCase().includes("phone number");
    }) ?? null;
}

function findResidenceCountryCode() {
  const select = document.querySelector<HTMLSelectElement>('select[name="base_country_code"]');
  if (select?.value) return select.value.trim().toUpperCase();

  const countryLabel = Array.from(document.querySelectorAll<HTMLElement>("label"))
    .find((label) => {
      const text = label.textContent ?? "";
      return text.includes("بلد الإقامة") || text.toLowerCase().includes("country of residence");
    });
  const countrySelect = countryLabel?.querySelector<HTMLSelectElement>("select");
  return countrySelect?.value?.trim().toUpperCase() ?? "";
}

function enhancePhoneField() {
  const input = findPhoneField();
  if (!input || input.dataset.mlamhDialCodeEnhanced === "1") return;

  const countryCode = findResidenceCountryCode();
  const country = TALENT_SIGNUP_COUNTRIES.find((item) => item.code === countryCode);
  if (!country) return;

  const wrapper = document.createElement("div");
  wrapper.dataset.mlamhPhoneWrapper = "1";
  wrapper.className = "flex min-h-14 overflow-hidden rounded-2xl border border-white/10 bg-black/20 focus-within:border-gold/50";
  wrapper.dir = "ltr";

  const prefix = document.createElement("span");
  prefix.className = "flex shrink-0 items-center border-r border-white/10 px-4 text-sm font-semibold text-gold";
  prefix.textContent = country.dialCode;

  input.parentNode?.insertBefore(wrapper, input);
  wrapper.appendChild(prefix);
  wrapper.appendChild(input);

  input.dataset.mlamhDialCodeEnhanced = "1";
  input.type = "tel";
  input.inputMode = "tel";
  input.dir = "ltr";
  input.placeholder = country.phoneExample;
  input.classList.remove("rounded-2xl", "border", "border-white/10");
  input.classList.add("min-w-0", "flex-1", "border-0", "bg-transparent", "px-4", "outline-none");

  const dialDigits = country.dialCode.replace(/\D/g, "");
  const currentDigits = input.value.replace(/\D/g, "");
  if (currentDigits.startsWith(dialDigits)) {
    input.value = currentDigits.slice(dialDigits.length).replace(/^0+/, "");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

function enhanceCanonicalFields() {
  if (!window.location.pathname.includes("/talent-dashboard/profile")) return;
  normalizeGenderSelect();
  normalizeNameRequirementHint();
  markProfileImageRequired();
  normalizeDateOfBirthField();
  normalizeResidenceCountrySelect();
  enhancePhoneField();
}

export function TalentProfileCanonicalFieldsV1() {
  useEffect(() => {
    if (!window.location.pathname.includes("/talent-dashboard/profile")) return;

    enhanceCanonicalFields();
    const observer = new MutationObserver(enhanceCanonicalFields);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
