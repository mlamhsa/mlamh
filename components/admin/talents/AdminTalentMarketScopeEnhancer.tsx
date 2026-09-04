"use client";

import { useEffect } from "react";

import { NATIONALITIES } from "@/lib/data/nationalities";

function normalizeCode(value: unknown) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

export function AdminTalentMarketScopeEnhancer() {
  useEffect(() => {
    const isArabic = document.documentElement.lang === "ar" ||
      document.querySelector('[dir="rtl"]') !== null;

    const countrySelect = document.querySelector<HTMLSelectElement>(
      'select[name="base_country_code"]',
    );

    if (countrySelect) {
      const selectedCode = normalizeCode(countrySelect.value);
      const placeholder = countrySelect.options[0]?.textContent || "—";

      countrySelect.replaceChildren();

      const emptyOption = document.createElement("option");
      emptyOption.value = "";
      emptyOption.textContent = placeholder;
      countrySelect.appendChild(emptyOption);

      const sortedCountries = [...NATIONALITIES]
        .sort((a, b) =>
          (isArabic ? a.countryAr : a.countryEn).localeCompare(
            isArabic ? b.countryAr : b.countryEn,
            isArabic ? "ar" : "en",
          ),
        );

      for (const country of sortedCountries) {
        const option = document.createElement("option");
        option.value = country.code;
        option.textContent = isArabic ? country.countryAr : country.countryEn;
        option.selected = normalizeCode(country.code) === selectedCode;
        countrySelect.appendChild(option);
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
          ? "المدينة داخل السعودية، ودولة الإقامة والجنسية متاحتان من قوائم عالمية موحدة. أسواق العمل مخفية مؤقتًا حتى تفعيل التوسع خارج السعودية."
          : "Saudi city, residence country, and nationality use controlled global lists. Work markets are temporarily hidden until expansion outside Saudi Arabia is activated.";
      }
    }

    const locationNavLink = document.querySelector<HTMLAnchorElement>('a[href="#location"] span');
    if (locationNavLink) {
      locationNavLink.textContent = isArabic ? "الموقع والجنسية" : "Location & nationality";
    }

    const workMarketInputs = Array.from(
      document.querySelectorAll<HTMLInputElement>('input[name="work_market_codes"]'),
    );

    if (workMarketInputs.length > 0) {
      const workMarketsContainer = workMarketInputs[0].closest("div.md\\:col-span-2");

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
