import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpenText } from "lucide-react";
import { notFound } from "next/navigation";

import { SceneArticleCard } from "@/components/scene/SceneArticleCard";
import { SceneCMS } from "@/lib/cms/SceneCMS";

export const revalidate = 300;

const SITE_URL = "https://mlamh.net";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

async function loadCategory(locale: "ar" | "en", slug: string) {
  const category = await SceneCMS.getPublicCategoryBySlug({ locale, slug });
  if (!category) return null;
  const articles = await SceneCMS.getPublicArticles({ locale, categoryId: category.id, limit: 60 });
  return { category, articles };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale: "ar" | "en" = rawLocale === "en" ? "en" : "ar";

  try {
    const category = await SceneCMS.getPublicCategoryBySlug({ locale, slug });
    if (!category) return {};

    const title = `${category.name} | ${locale === "ar" ? "مشهد ملامح" : "MLAMH Scene"}`;
    const description = category.description || (locale === "ar" ? "محتوى من مشهد ملامح." : "Content from MLAMH Scene.");
    const url = `${SITE_URL}/${locale}/scene/category/${category.slug}`;

    return {
      title,
      description,
      alternates: {
        canonical: url,
        languages: {
          ar: `${SITE_URL}/ar/scene/category/${category.slug}`,
          en: `${SITE_URL}/en/scene/category/${category.slug}`,
        },
      },
      openGraph: { title, description, url, siteName: "MLAMH", type: "website" },
      twitter: { card: "summary_large_image", title, description },
    };
  } catch {
    return {};
  }
}

export default async function SceneCategoryPage({ params }: PageProps) {
  const { locale: rawLocale, slug } = await params;
  const locale: "ar" | "en" = rawLocale === "en" ? "en" : "ar";
  const isArabic = locale === "ar";

  let loaded;
  try {
    loaded = await loadCategory(locale, slug);
  } catch (error) {
    console.error("[SceneCategoryPage]", error);
    throw error;
  }

  if (!loaded) notFound();
  const { category, articles } = loaded;
  const BackIcon = isArabic ? ArrowRight : ArrowLeft;

  return (
    <main dir={isArabic ? "rtl" : "ltr"} className="min-h-screen bg-black text-white">
      <section className="border-b border-white/[0.07] bg-[radial-gradient(circle_at_15%_10%,rgba(212,175,55,0.13),transparent_30%)]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
          <Link href={`/${locale}/scene`} className="inline-flex items-center gap-2 text-xs text-white/40 transition hover:text-gold">
            <BackIcon className="h-4 w-4" />
            {isArabic ? "العودة إلى مشهد ملامح" : "Back to MLAMH Scene"}
          </Link>
          <p className="mt-8 text-[10px] uppercase tracking-[0.35em] text-gold">MLAMH SCENE</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-light leading-tight sm:text-5xl md:text-6xl">{category.name}</h1>
          {category.description ? <p className="mt-5 max-w-3xl text-base leading-8 text-white/50 sm:text-lg">{category.description}</p> : null}
          <p className="mt-5 text-xs text-white/25">{articles.length} {isArabic ? "موضوع منشور" : articles.length === 1 ? "published article" : "published articles"}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
        {articles.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article, index) => <SceneArticleCard key={article.id} article={article} locale={locale} priority={index < 2} />)}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.02] px-6 py-16 text-center">
            <BookOpenText className="mx-auto h-8 w-8 text-gold/65" />
            <h2 className="mt-5 text-2xl font-light">{isArabic ? "المحتوى قيد الإعداد" : "Content is being prepared"}</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/40">
              {isArabic ? "سنضيف موضوعات هذا القسم تباعًا ضمن إطلاق مشهد ملامح." : "Articles for this section will be added progressively as MLAMH Scene launches."}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
