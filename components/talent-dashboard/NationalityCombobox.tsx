"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { NATIONALITIES } from "@/lib/data/nationalities";
import {
  matchesNationalitySearch,
  normalizeNationalitySlug,
  resolveNationality,
} from "@/lib/data/nationality-normalization";

const POPULAR_CODES = new Set([
  "SA", "EG", "YE", "SY", "JO", "PS", "PK", "IN", "SD", "AE", "MA", "PH", "BD", "LB", "IQ", "TN",
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
  const scrollYRef = useRef(0);
  const isArabic = locale === "ar";
  const isControlled = value !== undefined;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [internalSlug, setInternalSlug] = useState(() => normalizeNationalitySlug(defaultValue));

  const selectedSlug = isControlled ? normalizeNationalitySlug(value) : internalSlug;
  const selectedNationality = resolveNationality(selectedSlug);

  const filteredNationalities = useMemo(() => {
    const source = NATIONALITIES.filter((item) => matchesNationalitySearch(item, query));
    return [...source].sort((a, b) => {
      if (!query.trim()) {
        const popularDelta = Number(POPULAR_CODES.has(b.code)) - Number(POPULAR_CODES.has(a.code));
        if (popularDelta !== 0) return popularDelta;
      }
      return (isArabic ? a.ar : a.en).localeCompare(isArabic ? b.ar : b.en, isArabic ? "ar" : "en");
    });
  }, [isArabic, query]);

  useEffect(() => {
    function closePicker() {
      setOpen(false);
      setQuery("");
    }

    function handlePointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) closePicker();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closePicker();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    if (!window.matchMedia("(max-width: 639px)").matches) return;

    const body = document.body;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    };

    scrollYRef.current = window.scrollY;
    body.style.position = "fixed";
    body.style.top = `-${scrollYRef.current}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";

    return () => {
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.left = previous.left;
      body.style.right = previous.right;
      body.style.width = previous.width;
      body.style.overflow = previous.overflow;
      window.scrollTo({ top: scrollYRef.current, left: 0, behavior: "auto" });
    };
  }, [open]);

  function closePicker() {
    setOpen(false);
    setQuery("");
  }

  function selectNationality(slug: string) {
    if (!isControlled) setInternalSlug(slug);
    onChange?.(slug);
    closePicker();
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {name ? <input type="hidden" name={name} value={selectedSlug} /> : null}

      {showLabel ? (
        <label htmlFor={id ? `${id}-trigger` : undefined} className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-gray-muted">
          {isArabic ? "الجنسية" : "Nationality"}
        </label>
      ) : null}

      <button
        id={id ? `${id}-trigger` : undefined}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-start text-white outline-none transition hover:border-white/20 focus:border-gold/55 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={selectedNationality ? "text-white" : "text-white/35"}>
          {selectedNationality ? (isArabic ? selectedNationality.ar : selectedNationality.en) : (isArabic ? "اختر الجنسية" : "Select nationality")}
        </span>
        <span aria-hidden="true" className="text-white/35">⌄</span>
      </button>

      {open && !disabled ? (
        <>
          <button type="button" aria-label={isArabic ? "إغلاق اختيار الجنسية" : "Close nationality picker"} onClick={closePicker} className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-[2px] sm:hidden" />
          <div role="dialog" aria-modal="true" aria-label={isArabic ? "اختيار الجنسية" : "Select nationality"} className="fixed inset-x-0 bottom-0 z-[80] max-h-[82dvh] overflow-hidden rounded-t-[1.75rem] border border-b-0 border-gold/20 bg-[#080808] pb-[env(safe-area-inset-bottom)] shadow-2xl sm:absolute sm:inset-x-0 sm:bottom-auto sm:mt-2 sm:max-h-none sm:rounded-2xl sm:border sm:pb-0">
            <div className="border-b border-white/10 p-4 sm:p-3">
              <div className="mb-3 flex items-center justify-between gap-3 px-1 sm:hidden">
                <span className="text-base font-semibold text-white">{isArabic ? "اختر الجنسية" : "Select nationality"}</span>
                <button type="button" onClick={closePicker} className="min-h-9 rounded-full border border-white/10 px-4 text-xs text-white/65">{isArabic ? "إغلاق" : "Close"}</button>
              </div>
              <input type="search" inputMode="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={isArabic ? "ابحث عن الجنسية أو الدولة..." : "Search nationality or country..."} autoComplete="off" className="w-full rounded-xl border border-white/10 bg-black px-4 py-3.5 text-base text-white outline-none placeholder:text-white/25 focus:border-gold/45 sm:py-3 sm:text-sm" />
              <p className="mt-2 px-1 text-[11px] text-white/30">{isArabic ? "ابحث بالعربية أو الإنجليزية، باسم الجنسية أو الدولة." : "Search in Arabic or English by nationality or country."}</p>
            </div>
            <div role="listbox" className="max-h-[58dvh] overflow-y-auto overscroll-contain p-2 sm:max-h-80">
              {filteredNationalities.length > 0 ? filteredNationalities.map((nationality) => {
                const selected = nationality.slug === selectedSlug;
                return (
                  <button key={nationality.code} type="button" role="option" aria-selected={selected} onClick={() => selectNationality(nationality.slug)} className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-start text-sm transition ${selected ? "bg-gold/10 text-gold" : "text-white/80 hover:bg-white/[0.06] hover:text-white"}`}>
                    <span>{isArabic ? nationality.ar : nationality.en}</span>
                    <span className="text-xs text-white/35">{isArabic ? nationality.countryAr : nationality.countryEn}</span>
                  </button>
                );
              }) : <div className="px-4 py-8 text-center text-sm text-white/35">{isArabic ? "لا توجد نتيجة مطابقة." : "No matching nationality."}</div>}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
