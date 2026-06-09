import Link from "next/link";
import { SAUDI_CITIES } from "@/lib/data/saudi-cities";
import { TALENT_CATEGORIES } from "@/lib/data/talent-categories";
import type { Locale } from "@/lib/i18n";
import { talentPath } from "@/lib/utils/routes";

type TalentFiltersProps = {
  locale: Locale;
  q?: string;
  category?: string;
  city?: string;
};

export function TalentFilters({
  locale,
  q,
  category,
  city,
}: TalentFiltersProps) {
  const isRtl = locale === "ar";

  const hasFilters = Boolean(q?.trim() || category?.trim() || city?.trim());

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
              fontFamily: isRtl
                ? "var(--font-noto-arabic)"
                : "var(--font-cormorant)",
            }}
          >
            {isRtl ? "اعثر على الموهبة المناسبة" : "Find the right talent"}
          </h2>
        </div>

        <p className="max-w-xl text-sm leading-7 text-gray-muted">
          {isRtl
            ? "ابحث بالاسم أو اختر التخصص والمدينة لعرض المواهب المناسبة لمشروعك."
            : "Search by name, category, or city to find suitable profiles for your project."}
        </p>
      </div>

      <form
        method="GET"
        className="grid gap-3 md:grid-cols-[minmax(0,1fr)_240px_220px_auto_auto]"
      >
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder={
            isRtl ? "ابحث بالاسم..." : "Search by name..."
          }
          className="w-full rounded-2xl border border-white/10 bg-black/35 px-5 py-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-gold/40"
        />

        <select
          name="category"
          defaultValue={category ?? ""}
          className="w-full rounded-2xl border border-white/10 bg-black/35 px-5 py-4 text-sm text-white outline-none focus:border-gold/40"
        >
          <option value="">
            {isRtl ? "كل التخصصات" : "All Categories"}
          </option>

          {TALENT_CATEGORIES.map((option) => (
            <option key={option.slug} value={option.slug}>
              {isRtl ? option.ar : option.en}
            </option>
          ))}
        </select>

        <select
          name="city"
          defaultValue={city ?? ""}
          className="w-full rounded-2xl border border-white/10 bg-black/35 px-5 py-4 text-sm text-white outline-none focus:border-gold/40"
        >
          <option value="">
            {isRtl ? "كل المدن" : "All Cities"}
          </option>

          {SAUDI_CITIES.map((option) => (
            <option key={option.slug} value={option.slug}>
              {isRtl ? option.ar : option.en}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="rounded-2xl border border-gold/40 bg-gold/[0.06] px-6 py-4 text-[10px] uppercase tracking-[0.3em] text-gold transition hover:bg-gold/10"
        >
          {isRtl ? "بحث" : "Search"}
        </button>

        {hasFilters ? (
          <Link
            href={talentPath(locale)}
            className="rounded-2xl border border-white/10 px-6 py-4 text-center text-[10px] uppercase tracking-[0.3em] text-white/60 transition hover:border-white/30 hover:text-white"
          >
            {isRtl ? "مسح" : "Clear"}
          </Link>
        ) : null}
      </form>
    </section>
  );
}