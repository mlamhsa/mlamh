import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpenText, Search } from "lucide-react";

import { SceneArticleCard } from "@/components/scene/SceneArticleCard";
import { SceneCMS } from "@/lib/cms/SceneCMS";
import type { ScenePublicArticle } from "@/lib/types/scene";

export const revalidate = 300;

const SITE_URL = "https://mlamh.net";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
};

function normalizeSearch(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    // Normalize the common Arabic spellings used for casting so users can
    // find the same content with كاستنج / كاستينج / كاستينغ.
    .replace(/كاست(?:ينغ|ينج|نج)/g, "كاستنج")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesArticle(article: ScenePublicArticle, query: string) {
  const haystack = normalizeSearch(
    [article.title, article.excerpt, article.content, article.tags.join(" ")].join(" "),
  );
  return haystack.includes(query);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale: "ar" | "en" = rawLocale === "en" ? "en" : "ar";
  const isArabic = locale === "ar";
  const title = isArabic ? "البحث في مشهد ملامح" : "Search MLAMH Scene";
  const description = isArabic
    ? "ابحث في أدلة وقصص وتقارير مشهد ملامح."
    : "Search MLAMH Scene guides, stories and reports.";

  return {
    title,
    description,
    robots: { index: false, follow: true },
    alternates: { canonical: `${SITE_URL}/${locale}/scene/search` },
  };
}

export default async function SceneSearchPage({ params, searchParams }: PageProps) {
  const [{ locale: rawLocale }, query] = await Promise.all([params, searchParams]);
  const locale: "ar" | "en" = rawLocale === "en" ? "en" : "ar";
  const isArabic = locale === "ar";
  const rawQuery = String(query.q ?? "").trim().slice(0, 80);
  const normalizedQuery = normalizeSearch(rawQuery);
  const BackIcon = isArabic ? ArrowRight : ArrowLeft;

  let articles: ScenePublicArticle[] = [];
  if (normalizedQuery.length >= 2) {
    try {
      const published = await SceneCMS.getPublicArticles({ locale, limit: 100 });
      articles = published.filter((article) => matchesArticle(article, normalizedQuery));
    } catch (error) {
      console.error("[SceneSearchPage]", error);
    }
  }

  return (
    <main dir={isArabic ? "rtl" : "ltr"} className="min-h-screen bg-black text-white">
      <section className="border-b border-white/[0.07] bg-[radial-gradient(circle_at_15%_10%,rgba(212,175,55,0.12),transparent_30%)]">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
          <Link href={`/${locale}/scene`} className="inline-flex items-center gap-2 text-xs text-white/40 transition hover:text-gold">
            <BackIcon className="h-4 w-4" />
            {isArabic ? "العودة إلى مشهد ملامح" : "Back to MLAMH Scene"}
          </Link>

          <p className="mt-8 text-[10px] uppercase tracking-[0.35em] text-gold">MLAMH SCENE</p>
          <h1 className="mt-3 text-4xl font-light sm:text-5xl">
            {isArabic ? "ابحث في المشهد" : "Search the Scene"}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/42">
            {isArabic
              ? "ابحث في الأدلة والشروحات والقصص والتقارير المنشورة داخل مشهد ملامح."
              : "Search published guides, explainers, stories and reports across MLAMH Scene."}
          </p>

          <form action={`/${locale}/scene/search`} method="get" className="mt-7 flex gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-2">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                type="search"
                name="q"
                defaultValue={rawQuery}
                maxLength={80}
                autoComplete="off"
                placeholder={isArabic ? "اكتب موضوعًا أو كلمة..." : "Search a topic or keyword..."}
                className="h-12 w-full rounded-xl bg-black/45 ps-11 pe-4 text-sm text-white outline-none placeholder:text-white/25 focus:ring-1 focus:ring-gold/30"
              />
            </div>
            <button type="submit" className="h-12 rounded-xl bg-gold px-5 text-sm font-medium text-black transition hover:bg-gold-soft">
              {isArabic ? "بحث" : "Search"}
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
        {normalizedQuery.length < 2 ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.02] px-6 py-14 text-center">
            <Search className="mx-auto h-8 w-8 text-gold/65" />
            <p className="mt-4 text-sm text-white/45">
              {isArabic ? "اكتب حرفين على الأقل لبدء البحث." : "Enter at least two characters to search."}
            </p>
          </div>
        ) : articles.length > 0 ? (
          <>
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-gold">{isArabic ? "النتائج" : "RESULTS"}</p>
                <h2 className="mt-2 text-2xl font-light sm:text-3xl">
                  {isArabic ? `نتائج البحث عن «${rawQuery}»` : `Results for “${rawQuery}”`}
                </h2>
              </div>
              <span className="text-xs text-white/30">{articles.length}</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article, index) => (
                <SceneArticleCard key={article.id} article={article} locale={locale} priority={index < 2} />
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.02] px-6 py-16 text-center">
            <BookOpenText className="mx-auto h-8 w-8 text-gold/65" />
            <h2 className="mt-5 text-2xl font-light">{isArabic ? "لا توجد نتائج مطابقة" : "No matching results"}</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/40">
              {isArabic ? "جرّب كلمة أقصر أو موضوعًا أوسع، أو تصفح أقسام المشهد." : "Try a shorter keyword, a broader topic, or browse Scene categories."}
            </p>
            <Link href={`/${locale}/scene`} className="mt-6 inline-flex rounded-xl border border-white/10 px-4 py-3 text-xs text-white/60 transition hover:border-gold/30 hover:text-gold">
              {isArabic ? "تصفح المشهد" : "Browse the Scene"}
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
