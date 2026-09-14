"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { NATIONALITIES } from "@/lib/data/nationalities";
import {
  matchesNationalitySearch,
  normalizeNationalitySlug,
  resolveNationality,
} from "@/lib/data/nationality-normalization";

const POPULAR_CODES = new Set([
  "SA",
  "EG",
  "YE",
  "SY",
  "JO",
  "PS",
  "PK",
  "IN",
  "SD",
  "AE",
  "MA",
  "PH",
  "BD",
  "LB",
  "IQ",
  "TN",
]);

type Props = {
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (slug: string) => void;
  locale?: "ar" | "en";
  name?: string;
  id?: string;
  disabled?: boolean;
  showLabel?: boolean;
  className?: string;
};

export function NationalityCombobox({
  value,
  defaultValue,
  onChange,
  locale = "ar",
  name = "nationality_slug",
  id,
  disabled = false,
  showLabel = true,
  className = "",
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isArabic = locale === "ar";
  const isControlled = value !== undefined;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [internalSlug, setInternalSlug] = useState(() =>
    normalizeNationalitySlug(defaultValue),
  );

  const selectedSlug = isControlled
    ? normalizeNationalitySlug(value)
    : internalSlug;
  const selectedNationality = resolveNationality(selectedSlug);

  const filteredNationalities = useMemo(() => {
    const source = NATIONALITIES.filter((item) =>
      matchesNationalitySearch(item, query),
    );

    return [...source].sort((a, b) => {
      if (!query.trim()) {
        const popularDelta = Number(POPULAR_CODES.has(b.code)) - Number(POPULAR_CODES.has(a.code));
        if (popularDelta !== 0) return popularDelta;
      }

      return (isArabic ? a.ar : a.en).localeCompare(
        isArabic ? b.ar : b.en,
        isArabic ? "ar" : "en",
      );
    });
  }, [isArabic, query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setQuery("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectNationality(slug: string) {
    if (!isControlled) setInternalSlug(slug);
    onChange?.(slug);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {name ? <input type="hidden" name={name} value={selectedSlug} /> : null}

      {showLabel ? (
        <label
          htmlFor={id ? `${id}-trigger` : undefined}
          className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-gray-muted"
        >
          {isArabic ? "الجنسية" : "Nationality"}
        </label>
      ) : null}

      <button
        id={id ? `${id}-trigger` : undefined}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-start text-white outline-none transition hover:border-white/20 focus:border-gold/55 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={selectedNationality ? "text-white" : "text-white/35"}>
          {selectedNationality
            ? isArabic
              ? selectedNationality.ar
              : selectedNationality.en
            : isArabic
              ? "اختر الجنسية"
              : "Select nationality"}
        </span>
        <span aria-hidden="true" className="text-white/35">⌄</span>
      </button>

      {open && !disabled ? (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-gold/20 bg-[#080808] shadow-2xl">
          <div className="border-b border-white/10 p-3">
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={
                isArabic
                  ? "ابحث عن الجنسية أو الدولة..."
                  : "Search nationality or country..."
              }
              autoComplete="off"
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-gold/45"
            />
            <p className="mt-2 px-1 text-[11px] text-white/30">
              {isArabic
                ? "يمكنك البحث بالعربية أو الإنجليزية، باسم الجنسية أو الدولة."
                : "Search in Arabic or English by nationality or country."}
            </p>
          </div>

          <div role="listbox" className="max-h-80 overflow-y-auto p-2">
            {filteredNationalities.length > 0 ? (
              filteredNationalities.map((nationality) => {
                const selected = nationality.slug === selectedSlug;
                return (
                  <button
                    key={nationality.code}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => selectNationality(nationality.slug)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-start text-sm transition ${
                      selected
                        ? "bg-gold/10 text-gold"
                        : "text-white/80 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    <span>{isArabic ? nationality.ar : nationality.en}</span>
                    <span className="text-xs text-white/35">
                      {isArabic ? nationality.countryAr : nationality.countryEn}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-6 text-center text-sm text-white/35">
                {isArabic ? "لا توجد نتيجة مطابقة." : "No matching nationality."}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
