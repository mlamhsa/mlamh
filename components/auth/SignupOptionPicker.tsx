"use client";

import { Check, ChevronDown, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

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
  options: readonly Option[];
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
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const scrollYRef = useRef(0);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isArabic = locale === "ar";
  const selected = options.find((option) => option.value === value) ?? null;
  const useCompactDialog = options.length <= 4;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function close() {
      setOpen(false);
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (dialogRef.current?.contains(target)) return;
      close();
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

    const body = document.body;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    };

    const previousPickerOpen = body.dataset.mlamhPickerOpen;
    body.dataset.mlamhPickerOpen = "true";

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
      if (previousPickerOpen === undefined) {
        delete body.dataset.mlamhPickerOpen;
      } else {
        body.dataset.mlamhPickerOpen = previousPickerOpen;
      }
      window.scrollTo({ top: scrollYRef.current, left: 0, behavior: "auto" });
    };
  }, [open]);

  function choose(nextValue: string) {
    onChange(nextValue);
    setOpen(false);
  }

  const sheet = open && !disabled && mounted
    ? createPortal(
        <>
          <button
            type="button"
            aria-label={isArabic ? "إغلاق قائمة الاختيار" : "Close picker"}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[10010] bg-black/75 backdrop-blur-[3px] sm:hidden"
          />

          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${id}-title`}
            className={
              useCompactDialog
                ? "fixed left-1/2 top-1/2 z-[10020] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[1.75rem] border border-gold/20 bg-[#080808] shadow-2xl sm:absolute sm:left-0 sm:top-auto sm:z-[100] sm:mt-2 sm:w-full sm:max-w-none sm:translate-x-0 sm:translate-y-0 sm:rounded-2xl"
                : "fixed inset-x-0 bottom-0 z-[10020] max-h-[min(82dvh,calc(100dvh-env(safe-area-inset-top)-0.75rem))] overflow-hidden rounded-t-[1.75rem] border border-b-0 border-gold/20 bg-[#080808] pb-[env(safe-area-inset-bottom)] shadow-2xl sm:absolute sm:z-[100] sm:inset-x-auto sm:bottom-auto sm:mt-2 sm:w-full sm:rounded-2xl sm:border sm:pb-0"
            }
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4 sm:hidden">
              <span id={`${id}-title`} className="text-lg font-semibold text-white">
                {isArabic ? titleAr : titleEn}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/60 transition hover:border-white/20 hover:text-white"
                aria-label={isArabic ? "إغلاق" : "Close"}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className={useCompactDialog ? "grid gap-2 p-3 sm:max-h-64 sm:overflow-y-auto" : "max-h-[65dvh] overflow-y-auto overscroll-contain p-2 sm:max-h-64"}>
              {options.map((option) => {
                const active = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => choose(option.value)}
                    className={`flex w-full items-center justify-between gap-3 rounded-2xl border text-start transition ${
                      useCompactDialog
                        ? `min-h-16 px-4 text-base ${active ? "border-gold/35 bg-gold/[0.12] text-gold" : "border-white/[0.08] bg-white/[0.025] text-white/85 hover:border-white/15 hover:bg-white/[0.05]"}`
                        : `min-h-12 px-3.5 text-sm ${active ? "border-transparent bg-gold/[0.10] text-gold" : "border-transparent text-white/80 hover:bg-white/[0.05] hover:text-white"}`
                    }`}
                  >
                    <span>{isArabic ? option.ar : option.en}</span>
                    {active ? (
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/[0.08]">
                        <Check size={15} aria-hidden="true" />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </>,
        document.body,
      )
    : null;

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
      {sheet}
    </div>
  );
}