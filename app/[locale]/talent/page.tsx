import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Search, SlidersHorizontal, Sparkles, UsersRound } from "lucide-react";

import { Footer } from "@/components/Footer";
import { FeaturedTalentGrid } from "@/components/public/FeaturedTalentGrid";
import { PublicTalentCard } from "@/components/public/PublicTalentCard";
import { TalentEmptyState } from "@/components/public/TalentEmptyState";
import { TalentFilters } from "@/components/public/TalentFilters";
import { TalentPagination } from "@/components/public/TalentPagination";
import { PUBLIC_TALENTS_PAGE_SIZE } from "@/lib/constants/ui";
import { getDictionary, isValidLocale, type Locale } from "@/lib/i18n";
import { getFilteredPublicTalents } from "@/lib/talent/public-directory-filters";

export const dynamic = "force-dynamic";
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://mlamh.net").replace(/\/$/, "");

type TalentSearchParams = {
  q?: string;
  category?: string;
  city?: string;
  gender?: string;
  nationality?: string;
  ageMin?: string;
  ageMax?: string;
  heightMin?: string;
  heightMax?: string;
  page?: string;
};

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<TalentSearchParams>;
};

export async function generateMetadata({ params }: Pick<PageProps, "params">): Promise<Metadata> {
  const { locale: localeParam } = await params;
  if (!isValidLocale(localeParam)) return {};
  const locale = localeParam as Locale;
  const isArabic = locale === "ar";
  const title = isArabic ? "مودلز وممثلون في السعودية | دليل المواهب | ملامح" : "Models & Actors in Saudi Arabia | MLAMH Talents";
  const description = isArabic ? "اكتشف مودلز وممثلين في السعودية عبر منصة ملامح. ابحث عن المواهب حسب التخصص والمدينة والعمر والجنسية واختر الوجوه المناسبة لمشروعك." : "Discover models and actors in Saudi Arabia on MLAMH. Search talents by role, city, age, nationality, and more to find the right faces for your project.";
  const canonical = `${SITE_URL}/${locale}/talent`;
  return {
    title,
    description,
    alternates: { canonical, languages: { "ar-SA": `${SITE_URL}/ar/talent`, en: `${SITE_URL}/en/talent`, "x-default": `${SITE_URL}/ar/talent` } },
    openGraph: { title, description, url: canonical, type: "website", images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: isArabic ? "ملامح - منصة المواهب والكاستينج" : "MLAMH - Casting & Talents" }] },
    twitter: { card: "summary_large_image", title, description, images: [`${SITE_URL}/og-image.png`] },
  };
}

export default async function TalentListingPage({ params, searchParams }: PageProps) {
  const { locale: localeParam } = await params;
  const filters = await searchParams;
  if (!isValidLocale(localeParam)) notFound();

  const locale = localeParam as Locale;
  const isRtl = locale === "ar";
  getDictionary(locale);

  const requestedPage = Math.max(1, Number(filters.page) || 1);
  const { talents, total, totalPages, currentPage } = await getFilteredPublicTalents({
    page: requestedPage,
    pageSize: PUBLIC_TALENTS_PAGE_SIZE,
    search: filters.q,
    category: filters.category,
    city: filters.city,
    gender: filters.gender,
    nationality: filters.nationality,
    ageMin: filters.ageMin,
    ageMax: filters.ageMax,
    heightMin: filters.heightMin,
    heightMax: filters.heightMax,
  });

  const hasFilters = Boolean(
    filters.q?.trim() ||
      filters.category?.trim() ||
      filters.city?.trim() ||
      filters.gender?.trim() ||
      filters.nationality?.trim() ||
      filters.ageMin?.trim() ||
      filters.ageMax?.trim() ||
      filters.heightMin?.trim() ||
      filters.heightMax?.trim(),
  );

  const featuredIds = new Set(talents.filter((talent) => talent.featured).map((talent) => talent.id));
  const regularTalents = hasFilters ? talents : talents.filter((talent) => !featuredIds.has(talent.id));
  const visibleTalents = hasFilters ? talents : regularTalents;
  const resultLabel = isRtl ? `${total} نتيجة` : `${total} result${total === 1 ? "" : "s"}`;
  const seoLinks = [
    { href: `/${locale}/talent/category/actor`, label: isRtl ? "ممثلون في السعودية" : "Actors in Saudi Arabia" },
    { href: `/${locale}/talent/category/model`, label: isRtl ? "مودلز في السعودية" : "Models in Saudi Arabia" },
    { href: `/${locale}/talent/city/riyadh`, label: isRtl ? "ممثلون ومودلز في الرياض" : "Actors & Models in Riyadh" },
  ];

  const filterProps = {
    locale,
    q: filters.q,
    category: filters.category,
    city: filters.city,
    gender: filters.gender,
    nationality: filters.nationality,
    ageMin: filters.ageMin,
    ageMax: filters.ageMax,
    heightMin: filters.heightMin,
    heightMax: filters.heightMax,
  };

  const paginationProps = {
    locale,
    currentPage,
    totalPages,
    q: filters.q,
    category: filters.category,
    city: filters.city,
    gender: filters.gender,
    nationality: filters.nationality,
    ageMin: filters.ageMin,
    ageMax: filters.ageMax,
    heightMin: filters.heightMin,
    heightMax: filters.heightMax,
  };

  const SeoLinks = () => (
    <nav aria-label={isRtl ? "استكشف دليل المواهب" : "Explore talent directory"} className="mt-6 flex flex-wrap gap-2">
      {seoLinks.map((item) => (
        <a key={item.href} href={item.href} className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/60 transition hover:border-gold/30 hover:text-gold">
          {item.label}
        </a>
      ))}
    </nav>
  );

  return (
    <main className="min-h-screen bg-background text-white" dir={isRtl ? "rtl" : "ltr"}>
      <div className="lg:hidden">
        <section className="px-4 pb-8 pt-5">
          <header className="mb-6">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-3 py-1.5 text-xs text-gold">
                <UsersRound size={14} />
                <span>{isRtl ? "دليل المواهب" : "Talent directory"}</span>
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/55">{resultLabel}</div>
            </div>
            <h1 className="text-3xl font-semibold leading-tight text-white">{isRtl ? "اكتشف المواهب" : "Discover talents"}</h1>
            <p className="mt-2 max-w-sm text-sm leading-6 text-white/50">
              {isRtl ? "ابحث عن ممثلين ومودلز معتمدين في السعودية، ثم صفِّ النتائج حسب احتياج مشروعك." : "Find approved actors and models in Saudi Arabia, then filter results for your project needs."}
            </p>
            <SeoLinks />
          </header>

          <div className="rounded-[1.75rem] border border-white/[0.08] bg-white/[0.035] p-3 shadow-xl">
            <div className="mb-3 flex items-center gap-2 px-2">
              <Search size={16} className="text-gold" />
              <span className="text-xs font-medium text-white/65">{isRtl ? "البحث والتصفية" : "Search and filters"}</span>
              <SlidersHorizontal size={15} className={isRtl ? "mr-auto text-white/35" : "ml-auto text-white/35"} />
            </div>
            <TalentFilters {...filterProps} />
          </div>
        </section>

        {!hasFilters && talents.some((talent) => talent.featured) ? (
          <section className="overflow-hidden pb-9">
            <div className="mb-4 flex items-end justify-between gap-4 px-4">
              <div>
                <div className="mb-1 flex items-center gap-1.5 text-xs text-gold"><Sparkles size={13} /><span>{isRtl ? "مختارات ملامح" : "MLAMH selections"}</span></div>
                <h2 className="text-xl font-semibold text-white">{isRtl ? "مواهب مميزة" : "Featured talents"}</h2>
              </div>
            </div>
            <FeaturedTalentGrid talents={talents} locale={locale} />
          </section>
        ) : null}

        <section className="px-4 pb-8">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-gold">{hasFilters ? isRtl ? "نتائج البحث" : "Search results" : isRtl ? "جميع المواهب" : "All talents"}</p>
              <h2 className="mt-1 text-xl font-semibold text-white">{hasFilters ? isRtl ? "المواهب المطابقة" : "Matching talents" : isRtl ? "استكشف المزيد" : "Explore more"}</h2>
            </div>
            <span className="shrink-0 text-xs text-white/45">{resultLabel}</span>
          </div>

          {talents.length === 0 ? (
            <div className="rounded-[1.75rem] border border-white/[0.08] bg-white/[0.025] p-4"><TalentEmptyState title={isRtl ? "لا توجد نتائج" : "No talents found"} /></div>
          ) : visibleTalents.length === 0 ? (
            <div className="rounded-[1.75rem] border border-white/[0.08] bg-white/[0.025] p-4"><TalentEmptyState title={isRtl ? "المواهب الحالية معروضة بالأعلى" : "Current talents are already featured above"} description={isRtl ? "جميع النتائج الحالية تظهر ضمن قسم المواهب المميزة." : "All current results are already displayed in the featured section."} /></div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4">{visibleTalents.map((talent) => <PublicTalentCard key={talent.id} talent={talent} locale={locale} />)}</div>
              <div className="mt-8"><TalentPagination {...paginationProps} /></div>
            </>
          )}
        </section>
      </div>

      <div className="hidden lg:block">
        <section className="relative overflow-hidden pb-20 pt-32">
          <div className="relative mx-auto max-w-7xl px-6">
            <header className="mb-12">
              <p className="mb-4 text-[10px] uppercase tracking-[0.4em] text-gold">{isRtl ? "مواهب ملامح" : "MLAMH TALENTS"}</p>
              <h1 className="text-[clamp(3rem,8vw,6rem)] font-light leading-[0.92] text-white" style={{ fontFamily: isRtl ? "var(--font-noto-arabic)" : "var(--font-cormorant)" }}>
                {isRtl ? "ممثلون ومودلز في السعودية" : "Actors & Models in Saudi Arabia"}
              </h1>
              <p className="mt-6 max-w-2xl text-sm leading-relaxed text-gray-muted md:text-base">
                {isRtl ? "اكتشف ممثلين ومودلز منشورين على ملامح، واستخدم الفلاتر للوصول إلى الأنسب لمشاريع الكاستينج والتصوير والإعلانات." : "Discover published actors and models on MLAMH and use filters to find the best fit for casting, shoots, and campaigns."}
              </p>
              <SeoLinks />
            </header>

            <TalentFilters {...filterProps} />
            {!hasFilters ? <FeaturedTalentGrid talents={talents} locale={locale} /> : null}

            <div className="mb-6 flex items-center justify-between gap-4"><p className="text-sm text-gray-muted">{resultLabel}</p></div>

            {talents.length === 0 ? (
              <TalentEmptyState title={isRtl ? "لا توجد نتائج" : "No talents found"} />
            ) : visibleTalents.length === 0 ? (
              <TalentEmptyState title={isRtl ? "المواهب الحالية معروضة بالأعلى" : "Current talents are already featured above"} description={isRtl ? "جميع النتائج الحالية تظهر ضمن قسم المواهب المميزة." : "All current results are already displayed in the featured section."} />
            ) : (
              <>
                <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">{visibleTalents.map((talent) => <PublicTalentCard key={talent.id} talent={talent} locale={locale} />)}</div>
                <TalentPagination {...paginationProps} />
              </>
            )}
          </div>
        </section>
        <Footer locale={locale} />
      </div>
    </main>
  );
}
