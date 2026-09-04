"use client";

import { useEffect } from "react";

export function AdminTalentMarketScopeEnhancer() {
  useEffect(() => {
    const isArabic = document.documentElement.lang === "ar" ||
      document.querySelector('[dir="rtl"]') !== null;

    const countrySelect = document.querySelector<HTMLSelectElement>(
      'select[name="base_country_code"]',
    );
    const citySelect = document.querySelector<HTMLSelectElement>(
      'select[name="city_slug"]',
    );

    if (countrySelect) {
      const selectedCode = countrySelect.value.trim().toUpperCase();
      const hasExistingSaudiCity = Boolean(citySelect?.value.trim());
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
      // base_country_code is new for many legacy talents. If an existing record
      // already has a Saudi city but no country, selecting Saudi Arabia here is
      // a safe normalization on the next explicit admin save. Records without
      // a city stay unassigned, and non-SA historical country codes are not
      // overwritten silently by this enhancer.
      saOption.selected = selectedCode === "SA" || (!selectedCode && hasExistingSaudiCity);
      countrySelect.appendChild(saOption);

      if (selectedCode && selectedCode !== "SA") {
        const legacyOption = document.createElement("option");
        legacyOption.value = selectedCode;
        legacyOption.textContent = isArabic
          ? `القيمة الحالية: ${selectedCode}`
          : `Current value: ${selectedCode}`;
        legacyOption.selected = true;
        legacyOption.hidden = true;
        countrySelect.appendChild(legacyOption);
      }
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
          ? "السوق الحالي هو السعودية؛ لذلك تظهر السعودية فقط كدولة إقامة وتظهر المدن السعودية فقط. الجنسية مستقلة وتبقى متاحة من القائمة العالمية. القيم القديمة تُحفظ بدون تغيير تلقائي، وأسواق العمل مخفية مؤقتًا حتى تفعيل أسواق جديدة."
          : "Saudi Arabia is the active market, so only Saudi Arabia is shown as the residence country and only Saudi cities are shown. Nationality remains independent and globally selectable. Legacy values are preserved without silent changes, and work markets stay hidden until new markets are activated.";
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
