"use client";

import { useMemo, useState } from "react";
import { NATIONALITIES, findNationality, getNationalityBySlug } from "@/lib/data/nationalities";

type Props = {
  language: "ar" | "en";
  defaultNationality?: string | null;
  defaultSlug?: string | null;
};

export function SearchableNationalityField({ language, defaultNationality, defaultSlug }: Props) {
  const isArabic = language === "ar";
  const initial = getNationalityBySlug(defaultSlug) ?? findNationality(defaultNationality);
  const [query, setQuery] = useState(initial ? (isArabic ? initial.ar : initial.en) : defaultNationality ?? "");
  const [selectedSlug, setSelectedSlug] = useState(initial?.slug ?? "");

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const source = normalized
      ? NATIONALITIES.filter((item) =>
          [item.ar, item.en, item.countryAr, item.countryEn, item.code]
            .some((value) => value.toLowerCase().includes(normalized)),
        )
      : NATIONALITIES;
    return source.slice(0, 30);
  }, [query]);

  const selected = getNationalityBySlug(selectedSlug);

  return (
    <div className="relative">
      <label className="block">
        <span className="text-xs font-medium text-white/55">
          {isArabic ? "الجنسية" : "Nationality"}
        </span>
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setSelectedSlug("");
          }}
          placeholder={isArabic ? "ابحث: سعودي، مغربي، مصري..." : "Search: Saudi, Moroccan, Egyptian..."}
          autoComplete="off"
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-gold/40 focus:ring-1 focus:ring-gold/20"
        />
      </label>

      {query && !selectedSlug ? (
        <div className="absolute z-40 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-white/10 bg-[#111] p-1 shadow-2xl">
          {results.length > 0 ? results.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => {
                setSelectedSlug(item.slug);
                setQuery(isArabic ? item.ar : item.en);
              }}
              className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-start text-sm text-white/70 transition hover:bg-white/[0.06] hover:text-white"
            >
              <span>{isArabic ? item.ar : item.en}</span>
              <span className="text-[11px] text-white/30">{isArabic ? item.countryAr : item.countryEn}</span>
            </button>
          )) : (
            <div className="px-3 py-3 text-sm text-white/35">
              {isArabic ? "لا توجد نتيجة مطابقة." : "No matching nationality."}
            </div>
          )}
        </div>
      ) : null}

      <input type="hidden" name="nationality_slug" value={selectedSlug} />
      <input type="hidden" name="nationality_code" value={selected?.code ?? ""} />
      <input type="hidden" name="nationality" value={selected ? (isArabic ? selected.ar : selected.en) : ""} />

      <p className="mt-1.5 text-[11px] leading-5 text-white/25">
        {isArabic
          ? "ابحث باسم الجنسية أو الدولة بالعربية أو الإنجليزية، ثم اختر نتيجة من القائمة."
          : "Search by nationality or country in Arabic or English, then choose a result."}
      </p>
    </div>
  );
}
