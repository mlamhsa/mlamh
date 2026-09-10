"use client";

import { useMemo, useState, useTransition } from "react";

import {
  updateOwnTalentResidenceCountryAction,
} from "@/lib/actions/update-own-talent-residence-country";
import { TALENT_SIGNUP_COUNTRIES } from "@/lib/data/talent-signup";

type Props = {
  locale: "ar" | "en";
  currentCountryCode: string;
};

export function TalentResidenceCountrySelectorV1({
  locale,
  currentCountryCode,
}: Props) {
  const isArabic = locale === "ar";
  const [value, setValue] = useState(currentCountryCode);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const options = useMemo(
    () =>
      TALENT_SIGNUP_COUNTRIES.map((country) => ({
        value: country.code,
        label: isArabic ? country.ar : country.en,
      })),
    [isArabic],
  );

  const hasChanged = value !== currentCountryCode;

  function save() {
    if (!value || isPending || !hasChanged) return;

    setMessage("");
    startTransition(async () => {
      const result = await updateOwnTalentResidenceCountryAction(value);

      if (!result.success) {
        setMessage(
          isArabic
            ? "تعذر حفظ بلد الإقامة. حاول مرة أخرى."
            : "Could not save the residence country. Please try again.",
        );
        return;
      }

      window.location.reload();
    });
  }

  return (
    <section
      id="residence-country"
      className="mb-6 scroll-mt-28 rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] uppercase tracking-[0.24em] text-gold/75">
              {isArabic ? "بلد الإقامة" : "COUNTRY OF RESIDENCE"}
            </p>
            <span className="text-sm text-gold" title={isArabic ? "مطلوب للاعتماد" : "Required for approval"}>
              ⭐
            </span>
          </div>

          <p className="mt-2 text-sm leading-7 text-white/45">
            {isArabic
              ? "اختر بلد إقامتك الفعلي. بعد الحفظ ستتحدث قائمة المدن تلقائيًا حسب البلد المختار."
              : "Choose your actual country of residence. After saving, the city list will update automatically for that country."}
          </p>

          <select
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className="mt-4 min-h-14 w-full rounded-2xl border border-white/10 bg-black/35 px-4 text-sm text-white outline-none transition focus:border-gold/45"
          >
            <option value="">
              {isArabic ? "اختر بلد الإقامة" : "Select country of residence"}
            </option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {!currentCountryCode ? (
            <p className="mt-3 text-xs leading-6 text-amber-200/80">
              {isArabic
                ? "بلد الإقامة غير مكتمل في ملفك. اختر البلد ثم احفظه لإكمال هذا المتطلب."
                : "Your residence country is missing. Select and save it to complete this requirement."}
            </p>
          ) : null}

          {message ? (
            <p className="mt-3 text-xs text-red-300">{message}</p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={save}
          disabled={!value || !hasChanged || isPending}
          className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 px-6 text-sm text-gold transition hover:bg-gold hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending
            ? isArabic
              ? "جارٍ الحفظ..."
              : "Saving..."
            : isArabic
              ? "حفظ بلد الإقامة"
              : "Save country"}
        </button>
      </div>
    </section>
  );
}
