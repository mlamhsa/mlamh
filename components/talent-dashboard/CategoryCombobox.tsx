"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TALENT_CATEGORIES } from "@/lib/data/talent-categories";

export function CategoryCombobox({
  defaultValue,
}: {
  defaultValue?: string | null;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedSlug, setSelectedSlug] = useState(defaultValue ?? "");

  const selectedCategory = TALENT_CATEGORIES.find(
    (category) => category.slug === selectedSlug
  );

  const filteredCategories = useMemo(() => {
    const value = query.trim().toLowerCase();

    if (!value) return TALENT_CATEGORIES;

    return TALENT_CATEGORIES.filter((category) => {
      return (
        category.ar.includes(query.trim()) ||
        category.en.toLowerCase().includes(value) ||
        category.slug.toLowerCase().includes(value)
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
      <input
  type="hidden"
  name="category_slug"
  value={selectedSlug}
/>

      <label className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-gray-muted">
        التخصص
      </label>

      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition hover:border-gold/30 focus:border-gold/40"
      >
        <span className={selectedCategory ? "text-white" : "text-white/35"}>
          {selectedCategory ? selectedCategory.ar : "اختر التخصص"}
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
              placeholder="ابحث عن تخصص..."
              dir="rtl"
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-right text-sm text-white outline-none placeholder:text-white/30 focus:border-gold/40"
            />
          </div>

          <div className="max-h-72 overflow-y-auto p-2">
            {filteredCategories.length === 0 ? (
              <div className="px-4 py-5 text-center text-sm text-white/40">
                لا يوجد تخصص مطابق
              </div>
            ) : (
              filteredCategories.map((category) => {
                const active = category.slug === selectedSlug;

                return (
                  <button
                    key={category.slug}
                    type="button"
                    onClick={() => {
                      setSelectedSlug(category.slug);
                      setQuery("");
                      setOpen(false);
                    }}
                    className={`grid w-full grid-cols-[1fr_auto] items-center gap-4 rounded-xl px-4 py-3 text-right text-sm transition ${
                      active
                        ? "bg-gold/10 text-gold"
                        : "text-white/80 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    <span>{category.ar}</span>

                    <span className="flex items-center gap-3 text-xs text-white/35">
                      <span>{category.en}</span>
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