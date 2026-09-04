"use client";

import { useEffect } from "react";
import { NATIONALITIES, findNationality } from "@/lib/data/nationalities";

const DATALIST_ID = "mlamh-admin-nationalities";

export function AdminNationalityFieldEnhancer() {
  useEffect(() => {
    const form = document.querySelector<HTMLFormElement>('form[action]');
    const input = form?.querySelector<HTMLInputElement>('input[name="nationality"]');
    if (!form || !input) return;

    const isArabic = new URLSearchParams(window.location.search).get("lang") !== "en";
    input.setAttribute("list", DATALIST_ID);
    input.setAttribute("autocomplete", "off");
    input.placeholder = isArabic ? "ابحث: باكستاني، هندي، سعودي..." : "Search: Pakistani, Indian, Saudi...";

    const hint = input.parentElement?.querySelector("span.mt-1\\.5");
    if (hint) {
      hint.textContent = isArabic
        ? "ابحث واختر الجنسية من القائمة العالمية المعتمدة. الجنسية مستقلة عن دولة الإقامة."
        : "Search and choose from the global nationality list. Nationality is separate from residence country.";
    }

    let codeInput = form.querySelector<HTMLInputElement>('input[name="nationality_code"]');
    if (!codeInput) {
      codeInput = document.createElement("input");
      codeInput.type = "hidden";
      codeInput.name = "nationality_code";
      form.appendChild(codeInput);
    }

    const sync = () => {
      const match = findNationality(input.value);
      codeInput!.value = match?.code ?? "";
      input.setCustomValidity(
        input.value.trim() && !match
          ? isArabic
            ? "اختر الجنسية من القائمة."
            : "Choose a nationality from the list."
          : "",
      );
    };

    sync();
    input.addEventListener("input", sync);
    input.addEventListener("change", sync);
    return () => {
      input.removeEventListener("input", sync);
      input.removeEventListener("change", sync);
    };
  }, []);

  return (
    <datalist id={DATALIST_ID}>
      {NATIONALITIES.map((item) => (
        <option key={item.code} value={item.ar} label={`${item.en} — ${item.countryEn}`} />
      ))}
      {NATIONALITIES.map((item) => (
        <option key={`${item.code}-en`} value={item.en} label={`${item.ar} — ${item.countryAr}`} />
      ))}
    </datalist>
  );
}
