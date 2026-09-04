"use client";

import { useEffect } from "react";

import { NATIONALITIES, findNationality } from "@/lib/data/nationalities";

export function AdminNationalityFieldEnhancer() {
  useEffect(() => {
    const form = document.querySelector<HTMLFormElement>('form[action]');
    const input = form?.querySelector<HTMLInputElement>('input[name="nationality"]');
    if (!form || !input) return;

    const isArabic = new URLSearchParams(window.location.search).get("lang") !== "en";
    const legacyValue = input.value.trim();
    const currentNationality = findNationality(legacyValue);

    let codeInput = form.querySelector<HTMLInputElement>('input[name="nationality_code"]');
    if (!codeInput) {
      codeInput = document.createElement("input");
      codeInput.type = "hidden";
      codeInput.name = "nationality_code";
      form.appendChild(codeInput);
    }

    const select = document.createElement("select");
    select.name = "nationality_selector";
    select.className = input.className;
    select.setAttribute("aria-label", isArabic ? "الجنسية" : "Nationality");

    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = isArabic ? "اختر الجنسية" : "Choose nationality";
    select.appendChild(emptyOption);

    // Some early records may contain a free-text nationality that does not map
    // exactly to the canonical registry. Show that value instead of making the
    // admin think the record is blank. Leaving it selected keeps nationality_code
    // empty, so the server preserves the legacy value until an explicit choice.
    if (legacyValue && !currentNationality) {
      const legacyOption = document.createElement("option");
      legacyOption.value = "";
      legacyOption.textContent = isArabic
        ? `القيمة الحالية: ${legacyValue}`
        : `Current value: ${legacyValue}`;
      legacyOption.selected = true;
      select.appendChild(legacyOption);
    }

    const sortedNationalities = [...NATIONALITIES].sort((a, b) =>
      (isArabic ? a.ar : a.en).localeCompare(
        isArabic ? b.ar : b.en,
        isArabic ? "ar" : "en",
      ),
    );

    for (const item of sortedNationalities) {
      const option = document.createElement("option");
      option.value = item.code;
      option.textContent = isArabic
        ? `${item.ar} — ${item.countryAr}`
        : `${item.en} — ${item.countryEn}`;
      option.selected = currentNationality?.code === item.code;
      select.appendChild(option);
    }

    codeInput.value = currentNationality?.code ?? "";

    select.addEventListener("change", () => {
      codeInput!.value = select.value;
    });

    const hint = input.parentElement?.querySelector("span.mt-1\\.5");
    if (hint) {
      hint.textContent = isArabic
        ? "اختر الجنسية من القائمة العالمية. الجنسية مستقلة عن دولة الإقامة، وأي قيمة قديمة غير مطابقة تُحفظ حتى تختار بديلًا صراحة."
        : "Choose from the global nationality list. Nationality is separate from residence country, and unmatched legacy values are preserved until you explicitly replace them.";
    }

    input.replaceWith(select);
  }, []);

  return null;
}
