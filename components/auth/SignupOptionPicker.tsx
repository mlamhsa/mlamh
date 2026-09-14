"use client";

import { Check, ChevronDown, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Option = {
  value: string;
  ar: string;
  en: string;
};

type Props = {
  id: string;
  locale: "ar" | "en";
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholderAr: string;
  placeholderEn: string;
  titleAr: string;
  titleEn: string;
  disabled?: boolean;
};

export function SignupOptionPicker({
  id,
  locale,
  value,
  onChange,
  options,
  placeholderAr,
  placeholderEn,
  titleAr,
  titleEn,
  disabled = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const isArabic = locale === "ar";
  const selected = options.find((option) => option.value === value) ?? null;

  useEffect(() => {
    function close() {
      setOpen(false);
    }

    function onPointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) close();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    if (!window.matchMedia("(max-width: 639px)").matches) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function choose(nextValue: string) {
    onChange(nextValue);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        id={`${id}-trigger`}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-start text-white outline-none transition hover:border-white/20 focus:border-gold/55 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={selected ? "text-white" : "text-white/35"}>
          {selected ? (isArabic ? selected.ar : selected.en) : (isArabic ? placeholderAr : placeholderEn)}
        </span>
        <ChevronDown size={16} className="shrink-0 text-white/35" aria-hidden="true" />
      </button>

      {open && !disabled ? (
        <>
          <button
            type="button"
            aria-label={isArabic ? "إغلاق قائمة الاختيار" : "Close picker"}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-[2px] sm:hidden"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${id}-title`}
            className="fixed inset-x-0 bottom-0 z-[80] overflow-hidden rounded-t-[1.75rem] border border-b-0 border-gold/20 bg-[#080808] pb-[env(safe-area-inset-bottom)] shadow-2xl sm:absolute sm:inset-x-0 sm:bottom-auto sm:mt-2 sm:rounded-2xl sm:border sm:pb-0"
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3.5 sm:hidden">
              <span id={`${id}-title`} className="text-base font-semibold text-white">
                {isArabic ? titleAr : titleEn}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/60"
                aria-label={isArabic ? "إغلاق" : "Close"}
              >
                <X size={17} aria-hidden="true" />
              </button>
            </div>

            <div className="max-h-[55dvh] overflow-y-auto p-2 sm:max-h-64">
              {options.map((option) => {
                const active = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => choose(option.value)}
                    className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-3.5 text-start text-sm transition ${active ? "bg-gold/[0.10] text-gold" : "text-white/80 hover:bg-white/[0.05] hover:text-white"}`}
                  >
                    <span>{isArabic ? option.ar : option.en}</span>
                    {active ? <Check size={16} aria-hidden="true" /> : null}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
