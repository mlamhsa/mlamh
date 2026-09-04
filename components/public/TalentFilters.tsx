import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";

import { NATIONALITIES } from "@/lib/data/nationalities";
import { SAUDI_CITIES } from "@/lib/data/saudi-cities";
import type { Locale } from "@/lib/i18n";
import { talentPath } from "@/lib/utils/routes";

type TalentFiltersProps = {
  locale: Locale;
  q?: string;
  category?: string;
  city?: string;
  gender?: string;
  nationality?: string;
  ageMin?: string;
  ageMax?: string;
  heightMin?: string;
  heightMax?: string;
};

const PUBLIC_TALENT_CATEGORIES = [
  { slug: "actor", ar: "ممثل", en: "Actor" },
  { slug: "model", ar: "مودل", en: "Model" },
] as const;

export function TalentFilters({
  locale,
  q,
  category,
  city,
  gender,
  nationality,
  ageMin,
  ageMax,
  heightMin,
  heightMax,
}: TalentFiltersProps) {
  const isRtl = locale === "ar";
  const advancedActive = Boolean(
    gender?.trim() ||
      nationality?.trim() ||
      ageMin?.trim() ||
      ageMax?.trim() ||
      heightMin?.trim() ||
      heightMax?.trim(),
  );
  const hasFilters = Boolean(q?.trim() || category?.trim() || city?.trim() || advancedActive);

  const fieldClass =
    "w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-gold/40";

  return (
    <section className="mb-10 rounded-[32px] border border-white/[0.08] bg-neutral-950/80 p-5">
      <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-gold">
            {isRtl ? "بحث المواهب" : "Talent Search"}
          </p>

          <h2
            className="mt-2 text-2xl font-light text-white md:text-3xl"
            style={{
              fontFamily: isRtl ? "var(--font-noto-arabic)" : "var(--font-cormorant)",
            }}
          >
            {isRtl ? "اعثر على الموهبة المناسبة" : "Find the right talent"}
          </h2>
        </div>

        <p className="max-w-xl text-sm leading-7 text-gray-muted">
          {isRtl
            ? "ابحث بالاسم، وحدد ممثل أو مودل، ثم استخدم الفلاتر المتقدمة عند الحاجة."
            : "Search by name, choose Actor or Model, then use advanced filters when needed."}
        </p>
      </div>

      <form method="GET" className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_220px_auto]">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder={isRtl ? "ابحث بالاسم..." : "Search by name..."}
            className={fieldClass}
          />

          <select name="category" defaultValue={category ?? ""} className={fieldClass}>
            <option value="">{isRtl ? "كل التخصصات" : "All Categories"}</option>
            {PUBLIC_TALENT_CATEGORIES.map((option) => (
              <option key={option.slug} value={option.slug}>
                {isRtl ? option.ar : option.en}
              </option>
            ))}
          </select>

          <select name="city" defaultValue={city ?? ""} className={fieldClass}>
            <option value="">{isRtl ? "كل المدن" : "All Cities"}</option>
            {SAUDI_CITIES.map((option) => (
              <option key={option.slug} value={option.slug}>
                {isRtl ? option.ar : option.en}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="rounded-2xl border border-gold/40 bg-gold/[0.06] px-6 py-3.5 text-[10px] uppercase tracking-[0.3em] text-gold transition hover:bg-gold/10"
          >
            {isRtl ? "بحث" : "Search"}
          </button>
        </div>

        <details open={advancedActive} className="group rounded-2xl border border-white/[0.07] bg-black/20">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3.5 text-sm text-white/65 transition hover:text-white marker:content-none">
            <SlidersHorizontal size={16} className="text-gold" />
            <span>{isRtl ? "فلترة متقدمة" : "Advanced filters"}</span>
            {advancedActive ? (
              <span className="rounded-full border border-gold/20 bg-gold/10 px-2 py-0.5 text-[10px] text-gold">
                {isRtl ? "مفعّلة" : "Active"}
              </span>
            ) : null}
            <span className={isRtl ? "mr-auto text-white/30" : "ml-auto text-white/30"}>⌄</span>
          </summary>

          <div className="grid gap-3 border-t border-white/[0.07] p-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="grid gap-2">
              <span className="text-xs text-white/45">{isRtl ? "الجنس" : "Gender"}</span>
              <select name="gender" defaultValue={gender ?? ""} className={fieldClass}>
                <option value="">{isRtl ? "الكل" : "All"}</option>
                <option value="male">{isRtl ? "ذكر" : "Male"}</option>
                <option value="female">{isRtl ? "أنثى" : "Female"}</option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-xs text-white/45">{isRtl ? "الجنسية" : "Nationality"}</span>
              <select name="nationality" defaultValue={nationality ?? ""} className={fieldClass}>
                <option value="">{isRtl ? "كل الجنسيات" : "All nationalities"}</option>
                {NATIONALITIES.map((option) => (
                  <option key={option.code} value={option.code}>
                    {isRtl ? option.ar : option.en}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-2">
              <span className="text-xs text-white/45">{isRtl ? "العمر" : "Age"}</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  name="ageMin"
                  min="1"
                  max="100"
                  defaultValue={ageMin ?? ""}
                  placeholder={isRtl ? "من" : "Min"}
                  className={fieldClass}
                />
                <input
                  type="number"
                  name="ageMax"
                  min="1"
                  max="100"
                  defaultValue={ageMax ?? ""}
                  placeholder={isRtl ? "إلى" : "Max"}
                  className={fieldClass}
                />
              </div>
            </div>

            <div className="grid gap-2 sm:col-span-2 lg:col-span-1">
              <span className="text-xs text-white/45">{isRtl ? "الطول (سم)" : "Height (cm)"}</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  name="heightMin"
                  min="80"
                  max="230"
                  defaultValue={heightMin ?? ""}
                  placeholder={isRtl ? "من" : "Min"}
                  className={fieldClass}
                />
                <input
                  type="number"
                  name="heightMax"
                  min="80"
                  max="230"
                  defaultValue={heightMax ?? ""}
                  placeholder={isRtl ? "إلى" : "Max"}
                  className={fieldClass}
                />
              </div>
            </div>

            <div className="flex items-end gap-2 sm:col-span-2">
              <button
                type="submit"
                className="min-h-12 rounded-2xl bg-gold px-6 py-3 text-sm font-medium text-black transition hover:brightness-110"
              >
                {isRtl ? "تطبيق الفلاتر" : "Apply filters"}
              </button>

              {hasFilters ? (
                <Link
                  href={talentPath(locale)}
                  className="min-h-12 rounded-2xl border border-white/10 px-6 py-3 text-center text-sm text-white/60 transition hover:border-white/30 hover:text-white"
                >
                  {isRtl ? "مسح الكل" : "Clear all"}
                </Link>
              ) : null}
            </div>
          </div>
        </details>

        {hasFilters && !advancedActive ? (
          <div className="flex justify-end">
            <Link
              href={talentPath(locale)}
              className="text-xs text-white/45 transition hover:text-white"
            >
              {isRtl ? "مسح البحث والفلاتر" : "Clear search and filters"}
            </Link>
          </div>
        ) : null}
      </form>
    </section>
  );
}
