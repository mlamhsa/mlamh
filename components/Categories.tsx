import Link from "next/link";
import type { Dictionary, Locale } from "@/lib/i18n";

export function Categories({
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
}) {
  const isAr = locale === "ar";

  const talentsHref = `/${locale}/talent`;

  const categories = [
    {
      nameAr: "جميع المواهب",
      nameEn: "All Talents",
      slug: "all",
    },
    {
      nameAr: "ممثلون",
      nameEn: "Actors",
      slug: "actor",
    },
    {
      nameAr: "مودلز",
      nameEn: "Models",
      slug: "model",
    },
    {
      nameAr: "صناع محتوى",
      nameEn: "Creators",
      slug: "creator",
    },
    {
      nameAr: "مقدمو برامج",
      nameEn: "Presenters",
      slug: "presenter",
    },
    {
      nameAr: "أطفال",
      nameEn: "Kids",
      slug: "kids",
    },
  ];

  return (
    <section className="bg-black px-6 py-24 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 text-[10px] uppercase tracking-[0.4em] text-gold">
              {isAr ? "استكشف المواهب" : "Browse Talent"}
            </p>

            <h2
              className="text-4xl font-light tracking-tight md:text-6xl"
              style={{
                fontFamily: isAr
                  ? "var(--font-noto-arabic)"
                  : "var(--font-cormorant)",
              }}
            >
              {isAr
                ? "استكشف حسب التخصص"
                : "Browse By Category"}
            </h2>

            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-white/60">
              {isAr
                ? "اكتشف أبرز المواهب السعودية والخليجية حسب التخصص."
                : "Discover talents by profession and specialty."}
            </p>
          </div>

          <Link
            href={talentsHref}
            className="inline-flex items-center justify-center rounded-full border border-gold/30 px-6 py-3 text-[10px] uppercase tracking-[0.3em] text-gold transition hover:bg-gold/10"
          >
            {isAr
              ? "عرض جميع التخصصات"
              : "View All Categories"}
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const href =
              category.slug === "all"
                ? talentsHref
                : `${talentsHref}?category=${encodeURIComponent(
                    category.slug
                  )}`;

            return (
              <Link
                key={category.slug}
                href={href}
                className="group rounded-[32px] border border-white/[0.08] bg-neutral-950 p-8 transition-all duration-300 hover:-translate-y-1 hover:border-gold/30 hover:bg-neutral-900"
              >
                <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
                  MLAMH
                </p>

                <h3
                  className="mt-10 text-4xl font-light text-white"
                  style={{
                    fontFamily: isAr
                      ? "var(--font-noto-arabic)"
                      : "var(--font-cormorant)",
                  }}
                >
                  {isAr
                    ? category.nameAr
                    : category.nameEn}
                </h3>

                <div className="mt-10 flex items-center justify-between border-t border-white/[0.08] pt-5">
                  <span className="text-[10px] uppercase tracking-[0.25em] text-white/50">
                    {isAr
                      ? "استعرض المواهب"
                      : "Browse Talents"}
                  </span>

                  <span className="text-lg transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}