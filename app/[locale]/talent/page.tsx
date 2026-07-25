import { notFound } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { Footer } from "@/components/Footer";
import { FeaturedTalentGrid } from "@/components/public/FeaturedTalentGrid";
import { PublicTalentCard } from "@/components/public/PublicTalentCard";
import { TalentEmptyState } from "@/components/public/TalentEmptyState";
import { TalentFilters } from "@/components/public/TalentFilters";
import { TalentPagination } from "@/components/public/TalentPagination";

import { PUBLIC_TALENTS_PAGE_SIZE } from "@/lib/constants/ui";
import { getDictionary, isValidLocale, type Locale } from "@/lib/i18n";
import { getPublicTalents } from "@/lib/supabase/public-talents";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string;
    category?: string;
    city?: string;
    page?: string;
  }>;
};

export const metadata = {
  title: "Talents | MLAMH",
  description: "Explore published talents on MLAMH.",
};

export default async function TalentListingPage({
  params,
  searchParams,
}: PageProps) {
  const { locale: localeParam } = await params;
  const { q, category, city, page } = await searchParams;

  if (!isValidLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;
  const isRtl = locale === "ar";

  /*
   * نبقي استدعاء القاموس كما كان في بنية الصفحة الحالية
   * حتى لا تتأثر أي تبعيات مرتبطة بملفات الترجمة.
   */
  getDictionary(locale);

  const currentPage = Math.max(1, Number(page) || 1);

  const { talents, total, totalPages } = await getPublicTalents({
    page: currentPage,
    pageSize: PUBLIC_TALENTS_PAGE_SIZE,
    search: q,
    category,
    city,
  });

  const hasFilters = Boolean(
    q?.trim() || category?.trim() || city?.trim(),
  );

  const featuredIds = new Set(
    talents
      .filter((talent) => talent.featured)
      .map((talent) => talent.id),
  );

  const regularTalents = hasFilters
    ? talents
    : talents.filter((talent) => !featuredIds.has(talent.id));

  const visibleTalents = hasFilters ? talents : regularTalents;

  const resultLabel = isRtl
    ? `${total} نتيجة`
    : `${total} result${total === 1 ? "" : "s"}`;

  return (
    <main
      className="min-h-screen bg-background text-white"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Mobile app interface */}
      <div className="lg:hidden">
        <section className="px-4 pb-8 pt-5">
          <header className="mb-6">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-3 py-1.5 text-xs text-gold">
                <UsersRound size={14} />

                <span>
                  {isRtl ? "دليل المواهب" : "Talent directory"}
                </span>
              </div>

              <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/55">
                {resultLabel}
              </div>
            </div>

            <h1 className="text-3xl font-semibold leading-tight text-white">
              {isRtl ? "اكتشف المواهب" : "Discover talents"}
            </h1>

            <p className="mt-2 max-w-sm text-sm leading-6 text-white/50">
              {isRtl
                ? "ابحث عن المواهب المعتمدة حسب الاسم أو التخصص أو المدينة."
                : "Find approved talents by name, category or city."}
            </p>
          </header>

          <div className="rounded-[1.75rem] border border-white/[0.08] bg-white/[0.035] p-3 shadow-xl">
            <div className="mb-3 flex items-center gap-2 px-2">
              <Search size={16} className="text-gold" />

              <span className="text-xs font-medium text-white/65">
                {isRtl ? "البحث والتصفية" : "Search and filters"}
              </span>

              <SlidersHorizontal
                size={15}
                className={
                  isRtl
                    ? "mr-auto text-white/35"
                    : "ml-auto text-white/35"
                }
              />
            </div>

            <TalentFilters
              locale={locale}
              q={q}
              category={category}
              city={city}
            />
          </div>
        </section>

        {!hasFilters && talents.some((talent) => talent.featured) ? (
          <section className="overflow-hidden pb-9">
            <div className="mb-4 flex items-end justify-between gap-4 px-4">
              <div>
                <div className="mb-1 flex items-center gap-1.5 text-xs text-gold">
                  <Sparkles size={13} />

                  <span>
                    {isRtl ? "مختارات ملامح" : "MLAMH selections"}
                  </span>
                </div>

                <h2 className="text-xl font-semibold text-white">
                  {isRtl ? "مواهب مميزة" : "Featured talents"}
                </h2>
              </div>
            </div>

            <FeaturedTalentGrid
              talents={talents}
              locale={locale}
            />
          </section>
        ) : null}

        <section className="px-4 pb-8">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-gold">
                {hasFilters
                  ? isRtl
                    ? "نتائج البحث"
                    : "Search results"
                  : isRtl
                    ? "جميع المواهب"
                    : "All talents"}
              </p>

              <h2 className="mt-1 text-xl font-semibold text-white">
                {hasFilters
                  ? isRtl
                    ? "المواهب المطابقة"
                    : "Matching talents"
                  : isRtl
                    ? "استكشف المزيد"
                    : "Explore more"}
              </h2>
            </div>

            <span className="shrink-0 text-xs text-white/45">
              {resultLabel}
            </span>
          </div>

          {talents.length === 0 ? (
            <div className="rounded-[1.75rem] border border-white/[0.08] bg-white/[0.025] p-4">
              <TalentEmptyState
                title={isRtl ? "لا توجد نتائج" : "No talents found"}
              />
            </div>
          ) : visibleTalents.length === 0 ? (
            <div className="rounded-[1.75rem] border border-white/[0.08] bg-white/[0.025] p-4">
              <TalentEmptyState
                title={
                  isRtl
                    ? "المواهب الحالية معروضة بالأعلى"
                    : "Current talents are already featured above"
                }
                description={
                  isRtl
                    ? "جميع النتائج الحالية تظهر ضمن قسم المواهب المميزة."
                    : "All current results are already displayed in the featured section."
                }
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4">
                {visibleTalents.map((talent) => (
                  <PublicTalentCard
                    key={talent.id}
                    talent={talent}
                    locale={locale}
                  />
                ))}
              </div>

              <div className="mt-8">
                <TalentPagination
                  locale={locale}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  q={q}
                  category={category}
                  city={city}
                />
              </div>
            </>
          )}
        </section>
      </div>

      {/* Existing desktop website */}
      <div className="hidden lg:block">
        <section className="relative overflow-hidden pb-20 pt-32">
          <div className="relative mx-auto max-w-7xl px-6">
            <header className="mb-12">
              <p className="mb-4 text-[10px] uppercase tracking-[0.4em] text-gold">
                {isRtl ? "مواهب ملامح" : "MLAMH TALENTS"}
              </p>

              <h1
                className="text-[clamp(3rem,8vw,6rem)] font-light leading-[0.92] text-white"
                style={{
                  fontFamily: isRtl
                    ? "var(--font-noto-arabic)"
                    : "var(--font-cormorant)",
                }}
              >
                {isRtl ? "اكتشف المواهب" : "Discover Talents"}
              </h1>

              <p className="mt-6 max-w-2xl text-sm leading-relaxed text-gray-muted md:text-base">
                {isRtl
                  ? "استعرض المواهب المعتمدة والمنشورة على منصة ملامح."
                  : "Explore featured and approved talents on MLAMH."}
              </p>
            </header>

            <TalentFilters
              locale={locale}
              q={q}
              category={category}
              city={city}
            />

            {!hasFilters ? (
              <FeaturedTalentGrid
                talents={talents}
                locale={locale}
              />
            ) : null}

            <div className="mb-6 flex items-center justify-between gap-4">
              <p className="text-sm text-gray-muted">
                {resultLabel}
              </p>
            </div>

            {talents.length === 0 ? (
              <TalentEmptyState
                title={isRtl ? "لا توجد نتائج" : "No talents found"}
              />
            ) : visibleTalents.length === 0 ? (
              <TalentEmptyState
                title={
                  isRtl
                    ? "المواهب الحالية معروضة بالأعلى"
                    : "Current talents are already featured above"
                }
                description={
                  isRtl
                    ? "جميع النتائج الحالية تظهر ضمن قسم المواهب المميزة."
                    : "All current results are already displayed in the featured section."
                }
              />
            ) : (
              <>
                <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
                  {visibleTalents.map((talent) => (
                    <PublicTalentCard
                      key={talent.id}
                      talent={talent}
                      locale={locale}
                    />
                  ))}
                </div>

                <TalentPagination
                  locale={locale}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  q={q}
                  category={category}
                  city={city}
                />
              </>
            )}
          </div>
        </section>

        <Footer locale={locale} />
      </div>
    </main>
  );
}