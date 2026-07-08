"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SAUDI_CITIES } from "@/lib/data/saudi-cities";

export function CityCombobox({
  defaultValue,
}: {
  defaultValue?: string | null;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedSlug, setSelectedSlug] = useState(defaultValue ?? "");

  const selectedCity = SAUDI_CITIES.find((city) => city.slug === selectedSlug);

  const filteredCities = useMemo(() => {
    const value = query.trim().toLowerCase();

    if (!value) return SAUDI_CITIES;

    return SAUDI_CITIES.filter((city) => {
      return (
        city.ar.includes(query.trim()) ||
        city.en.toLowerCase().includes(value) ||
        city.slug.toLowerCase().includes(value)
      );
    });
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

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative md:col-span-2">
      <input type="hidden" name="city_slug" value={selectedSlug} />

      <label className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-gray-muted">
  المدينة
</label>

      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition hover:border-gold/30 focus:border-gold/40"
      >
        <span className={selectedCity ? "text-white" : "text-white/35"}>
          {selectedCity ? selectedCity.ar : "اختر المدينة"}
        </span>

        <span
          className={`text-gold transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        >
         ⌄
        </span>
      </button>

      {open ? (
        <div className="absolute z-50 mt-3 w-full overflow-hidden rounded-2xl border border-gold/20 bg-[#080808] shadow-2xl shadow-black/50">
          <div className="border-b border-white/10 p-3">
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ابحث عن مدينة..."
              dir="rtl"
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-right text-sm text-white outline-none placeholder:text-white/30 focus:border-gold/40"
            />
          </div>

          <div className="max-h-72 overflow-y-auto p-2">
            {filteredCities.length === 0 ? (
              <div className="px-4 py-5 text-center text-sm text-white/40">
                لا توجد مدينة مطابقة
              </div>
            ) : (
              filteredCities.map((city) => {
                const active = city.slug === selectedSlug;

                return (
                  <button
                    key={city.slug}
                    type="button"
                    onClick={() => {
                      setSelectedSlug(city.slug);
                      setQuery("");
                      setOpen(false);
                    }}
                    className={`grid w-full grid-cols-[1fr_auto] items-center gap-4 rounded-xl px-4 py-3 text-right text-sm transition ${
                      active
                        ? "bg-gold/10 text-gold"
                        : "text-white/80 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    <span>{city.ar}</span>

                    <span className="flex items-center gap-3 text-xs text-white/35">
                      <span>{city.en}</span>
                      {active ? <span className="text-gold">✓</span> : null}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}