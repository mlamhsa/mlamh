import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { FeaturedTalentGrid } from "@/components/public/FeaturedTalentGrid";
import { PublicTalentCard } from "@/components/public/PublicTalentCard";
import { TalentEmptyState } from "@/components/public/TalentEmptyState";
import { TalentFilters } from "@/components/public/TalentFilters";
import { TalentPagination } from "@/components/public/TalentPagination";
import { PUBLIC_TALENTS_PAGE_SIZE } from "@/lib/constants/ui";
import { getDictionary, isValidLocale, type Locale } from "@/lib/i18n";
import { getPublicTalents } from "@/lib/supabase/public-talents";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string;
    category?: string;
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

  const { q, category, page } =
    await searchParams;

  if (!isValidLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;

  const isRtl = locale === "ar";

  const dict = getDictionary(locale);

  const currentPage = Math.max(
    1,
    Number(page) || 1
  );

  const { talents, total, totalPages } =
    await getPublicTalents({
      page: currentPage,
      pageSize: PUBLIC_TALENTS_PAGE_SIZE,
      search: q,
      category,
    });

  const hasFilters = Boolean(
    q?.trim() || category?.trim()
  );

  const featuredIds = new Set(
    talents
      .filter((talent) => talent.featured)
      .map((talent) => talent.id)
  );

  const regularTalents = hasFilters
    ? talents
    : talents.filter(
        (talent) => !featuredIds.has(talent.id)
      );

  const visibleTalents = hasFilters
    ? talents
    : regularTalents;

  return (
    <main
      className="min-h-screen bg-background text-white"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <Navbar dict={dict} locale={locale} />

      <section className="relative overflow-hidden pt-32 pb-20">
        <div className="relative mx-auto max-w-7xl px-6">
          <header className="mb-12">
            <p className="mb-4 text-[10px] uppercase tracking-[0.4em] text-gold">
              {isRtl
                ? "مواهب ملامح"
                : "MLAMH TALENTS"}
            </p>

            <h1
              className="text-[clamp(3rem,8vw,6rem)] leading-[0.92] font-light text-white"
              style={{
                fontFamily: isRtl
                  ? "var(--font-noto-arabic)"
                  : "var(--font-cormorant)",
              }}
            >
              {isRtl
                ? "اكتشف المواهب"
                : "Discover Talents"}
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
          />

          {!hasFilters ? (
            <FeaturedTalentGrid
              talents={talents}
              locale={locale}
            />
          ) : null}

          <div className="mb-6 flex items-center justify-between gap-4">
            <p className="text-sm text-gray-muted">
              {isRtl
                ? `${total} نتيجة`
                : `${total} result${
                    total === 1 ? "" : "s"
                  }`}
            </p>
          </div>

          {talents.length === 0 ? (
            <TalentEmptyState
              title={
                isRtl
                  ? "لا توجد نتائج"
                  : "No talents found"
              }
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
              />
            </>
          )}
        </div>
      </section>

      <Footer dict={dict} locale={locale} />
    </main>
  );
}