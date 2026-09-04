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
    input.placeholder = isArabic ? "ابحث: سعودي، مغربي، مصري..." : "Search: Saudi, Moroccan, Egyptian...";

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
      if (input.value.trim() && !match) {
        input.setCustomValidity(isArabic ? "اختر الجنسية من القائمة." : "Choose a nationality from the list.");
      } else {
        input.setCustomValidity("");
      }
    };

    sync();
    input.addEventListener("input", sync);
    input.addEventListener("change", sync);
    return () => {
      input.removeEventListener("input", sync);
      input.removeEventListener("change", sync);
    };
  }, []);

  const isArabic = true;

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
