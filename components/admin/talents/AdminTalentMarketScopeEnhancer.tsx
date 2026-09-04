"use client";

import { useEffect } from "react";

export function AdminTalentMarketScopeEnhancer() {
  useEffect(() => {
    const isArabic = document.documentElement.lang === "ar" ||
      document.querySelector('[dir="rtl"]') !== null;

    const countrySelect = document.querySelector<HTMLSelectElement>(
      'select[name="base_country_code"]',
    );

    if (countrySelect) {
      const selectedCode = countrySelect.value.trim().toUpperCase();
      const placeholder = countrySelect.options[0]?.textContent ||
        (isArabic ? "اختر الدولة" : "Choose country");

      countrySelect.replaceChildren();

      const emptyOption = document.createElement("option");
      emptyOption.value = "";
      emptyOption.textContent = placeholder;
      countrySelect.appendChild(emptyOption);

      const saOption = document.createElement("option");
      saOption.value = "SA";
      saOption.textContent = isArabic ? "السعودية" : "Saudi Arabia";
      saOption.selected = selectedCode === "SA";
      countrySelect.appendChild(saOption);
    }

    const locationSection = document.getElementById("location");
    if (locationSection) {
      const title = locationSection.querySelector("h2");
      const description = title?.nextElementSibling;

      if (title) {
        title.textContent = isArabic
          ? "الموقع والجنسية"
          : "Location & nationality";
      }

      if (description instanceof HTMLElement) {
        description.textContent = isArabic
          ? "السوق الحالي هو السعودية؛ لذلك تظهر السعودية فقط كدولة إقامة وتظهر المدن السعودية فقط. الجنسية مستقلة وتبقى متاحة من القائمة العالمية. أسواق العمل مخفية مؤقتًا حتى تفعيل أسواق جديدة."
          : "Saudi Arabia is the active market, so only Saudi Arabia is shown as the residence country and only Saudi cities are shown. Nationality remains independent and globally selectable. Work markets stay hidden until new markets are activated.";
      }
    }

    const locationNavLink = document.querySelector<HTMLAnchorElement>(
      'a[href="#location"] span',
    );
    if (locationNavLink) {
      locationNavLink.textContent = isArabic
        ? "الموقع والجنسية"
        : "Location & nationality";
    }

    const workMarketInputs = Array.from(
      document.querySelectorAll<HTMLInputElement>('input[name="work_market_codes"]'),
    );

    if (workMarketInputs.length > 0) {
      const workMarketsContainer = workMarketInputs[0].closest(
        "div.md\\:col-span-2",
      );

      if (workMarketsContainer instanceof HTMLElement) {
        workMarketsContainer.hidden = true;
        workMarketsContainer.setAttribute("aria-hidden", "true");
      }

      for (const input of workMarketInputs) {
        input.disabled = true;
      }
    }
  }, []);

  return null;
}
