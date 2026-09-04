"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { NATIONALITIES } from "@/lib/data/nationalities";

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function resolveNationalitySlug(value: string | null | undefined) {
  const candidate = normalize(value);
  if (!candidate) return "";

  const match = NATIONALITIES.find((item) => {
    return (
      normalize(item.slug) === candidate ||
      normalize(item.code) === candidate ||
      normalize(item.ar) === candidate ||
      normalize(item.en) === candidate
    );
  });

  return match?.slug ?? "";
}

export function NationalityCombobox({
  defaultValue,
}: {
  defaultValue?: string | null;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedSlug, setSelectedSlug] = useState(() =>
    resolveNationalitySlug(defaultValue)
  );

  const selectedNationality = NATIONALITIES.find(
    (item) => item.slug === selectedSlug
  );

  const filteredNationalities = useMemo(() => {
    const value = query.trim().toLowerCase();

    if (!value) {
      return NATIONALITIES;
    }

    return NATIONALITIES.filter(
      (item) =>
        item.ar.includes(query.trim()) ||
        item.en.toLowerCase().includes(value) ||
        item.countryAr.includes(query.trim()) ||
        item.countryEn.toLowerCase().includes(value) ||
        item.code.toLowerCase().includes(value) ||
        item.slug.toLowerCase().includes(value)
    );
  }, [query]);

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

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <input
        type="hidden"
        name="nationality_slug"
        value={selectedSlug}
      />

      <label className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-gray-muted">
        الجنسية
      </label>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white"
      >
        <span>
          {selectedNationality
            ? selectedNationality.ar
            : "اختر الجنسية"}
        </span>

        <span>⌄</span>
      </button>

      {open ? (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-gold/20 bg-[#080808]">
          <div className="border-b border-white/10 p-3">
            <input
              autoFocus
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="ابحث عن الجنسية أو الدولة..."
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none"
            />
          </div>

          <div className="max-h-72 overflow-y-auto p-2">
            {filteredNationalities.map((nationality) => (
              <button
                key={nationality.slug}
                type="button"
                onClick={() => {
                  setSelectedSlug(nationality.slug);
                  setOpen(false);
                  setQuery("");
                }}
                className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-right text-sm text-white/80 hover:bg-white/[0.06]"
              >
                <span>{nationality.ar}</span>
                <span className="text-xs text-white/35">
                  {nationality.en}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
