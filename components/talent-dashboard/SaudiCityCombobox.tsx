"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  getSaudiCityBySlug,
  matchesSaudiCitySearch,
  normalizeSaudiCitySlug,
  SAUDI_CITIES,
} from "@/lib/data/saudi-cities";

const POPULAR_CITY_SLUGS = new Set([
  "riyadh",
  "jeddah",
  "makkah",
  "madinah",
  "dammam",
  "khobar",
  "taif",
  "tabuk",
  "abha",
  "khamis-mushait",
  "buraydah",
  "jazan",
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

export function SaudiCityCombobox({
  value,
  defaultValue,
  onChange,
  locale = "ar",
  name = "city_slug",
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
    normalizeSaudiCitySlug(defaultValue),
  );

  const selectedSlug = isControlled
    ? normalizeSaudiCitySlug(value)
    : internalSlug;
  const selectedCity = getSaudiCityBySlug(selectedSlug);

  const filteredCities = useMemo(() => {
    const source = SAUDI_CITIES.filter((city) => matchesSaudiCitySearch(city, query));

    return [...source].sort((a, b) => {
      if (!query.trim()) {
        const popularDelta =
          Number(POPULAR_CITY_SLUGS.has(b.slug)) - Number(POPULAR_CITY_SLUGS.has(a.slug));
        if (popularDelta !== 0) return popularDelta;
      }

      return (isArabic ? a.ar : a.en).localeCompare(
        isArabic ? b.ar : b.en,
        isArabic ? "ar" : "en",
      );
    });
  }, [isArabic, query]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setQuery("");
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function selectCity(slug: string) {
    const normalized = normalizeSaudiCitySlug(slug);
    if (!isControlled) setInternalSlug(normalized);
    onChange?.(normalized);
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
          {isArabic ? "المدينة" : "City"}
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
        <span className={selectedCity ? "text-white" : "text-white/35"}>
          {selectedCity
            ? isArabic
              ? selectedCity.ar
              : selectedCity.en
            : isArabic
              ? "اختر المدينة"
              : "Select city"}
        </span>
        <span aria-hidden="true" className="text-white/35">⌄</span>
      </button>

      {open && !disabled ? (
        <div className="fixed inset-x-3 bottom-3 z-[80] max-h-[72dvh] overflow-hidden rounded-2xl border border-gold/20 bg-[#080808] shadow-2xl sm:absolute sm:inset-x-0 sm:bottom-auto sm:mt-2 sm:max-h-none">
          <div className="border-b border-white/10 p-3">
            <div className="mb-2 flex items-center justify-between gap-3 px-1 sm:hidden">
              <span className="text-sm font-semibold text-white">
                {isArabic ? "اختر المدينة" : "Select city"}
              </span>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setQuery("");
                }}
                className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/60"
              >
                {isArabic ? "إغلاق" : "Close"}
              </button>
            </div>
            <input
              autoFocus
              type="search"
              inputMode="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={isArabic ? "ابحث عن مدينتك..." : "Search for your city..."}
              autoComplete="off"
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-gold/45"
            />
            <p className="mt-2 px-1 text-[11px] text-white/30">
              {isArabic
                ? "ابحث بالعربية أو الإنجليزية. خيار «أخرى» غير مستخدم."
                : "Search in Arabic or English. The “Other” option is not used."}
            </p>
          </div>

          <div role="listbox" className="max-h-[52dvh] overflow-y-auto overscroll-contain p-2 sm:max-h-80">
            {filteredCities.length > 0 ? (
              filteredCities.map((city) => {
                const selected = city.slug === selectedSlug;
                return (
                  <button
                    key={city.slug}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => selectCity(city.slug)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-start text-sm transition ${
                      selected
                        ? "bg-gold/10 text-gold"
                        : "text-white/80 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    <span>{isArabic ? city.ar : city.en}</span>
                    <span className="text-xs text-white/30">
                      {isArabic ? city.en : city.ar}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-6 text-center text-sm text-white/35">
                {isArabic ? "لا توجد مدينة مطابقة." : "No matching city."}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
