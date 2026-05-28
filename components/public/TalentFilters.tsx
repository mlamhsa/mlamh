import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { talentPath } from "@/lib/utils/routes";

type TalentFiltersProps = {
  locale: Locale;
  q?: string;
  category?: string;
};

export function TalentFilters({
  locale,
  q,
  category,
}: TalentFiltersProps) {
  const isRtl = locale === "ar";

  const hasFilters = Boolean(q?.trim() || category?.trim());

  return (
    <form
      method="GET"
      className="mb-10 grid gap-3 md:grid-cols-[minmax(0,1fr)_260px_auto_auto]"
    >
      <input
        name="q"
        defaultValue={q ?? ""}
        placeholder={isRtl ? "ابحث عن موهبة..." : "Search talents..."}
        className="w-full rounded-full border border-white/10 bg-black/30 px-5 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-gold/40"
      />

      <input
        name="category"
        defaultValue={category ?? ""}
        placeholder={isRtl ? "التصنيف..." : "Category..."}
        className="w-full rounded-full border border-white/10 bg-black/30 px-5 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-gold/40"
      />

      <button
        type="submit"
        className="rounded-full border border-gold/40 px-6 py-3 text-[10px] uppercase tracking-[0.3em] text-gold hover:bg-gold/10"
      >
        {isRtl ? "بحث" : "Search"}
      </button>

      {hasFilters ? (
        <Link
          href={talentPath(locale)}
          className="rounded-full border border-white/10 px-6 py-3 text-center text-[10px] uppercase tracking-[0.3em] text-white/60 hover:border-white/30 hover:text-white"
        >
          {isRtl ? "مسح" : "Clear"}
        </Link>
      ) : null}
    </form>
  );
}