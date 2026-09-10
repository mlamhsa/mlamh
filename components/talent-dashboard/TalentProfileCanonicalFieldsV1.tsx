"use client";

import { useEffect } from "react";

import { GENDER_OPTIONS } from "@/lib/data/talent-signup";

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
  if (!container || container.querySelector("[data-mlamh-image-required-hint]")) return;

  const hint = document.createElement("p");
  hint.dataset.mlamhImageRequiredHint = "1";
  hint.className = "mt-2 text-xs text-gold";
  hint.textContent = isArabicPage()
    ? "⭐ الصورة الشخصية الواضحة مطلوبة للاعتماد."
    : "⭐ A clear profile photo is required for approval.";
  container.appendChild(hint);
}

function enhanceCanonicalFields() {
  if (!window.location.pathname.includes("/talent-dashboard/profile")) return;
  normalizeGenderSelect();
  normalizeNameRequirementHint();
  markProfileImageRequired();
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
