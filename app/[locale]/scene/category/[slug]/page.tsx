import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpenText } from "lucide-react";
import { notFound } from "next/navigation";

import { SceneArticleCard } from "@/components/scene/SceneArticleCard";
import { SceneCMS } from "@/lib/cms/SceneCMS";
import type { ScenePublicArticle, ScenePublicCategory } from "@/lib/types/scene";

export const revalidate = 300;

const SITE_URL = "https://mlamh.net";

const CATEGORY_SEO_TITLES: Record<string, { ar: string; en: string }> = {
  talent: {
    ar: "التمثيل والمودلز والكاستنج للمواهب في السعودية | ملامح",
    en: "Acting, Modeling & Casting Guides for Talent in Saudi Arabia | MLAMH",
  },
  publishers: {
    ar: "دليل الكاستنج واختيار الممثلين والمودلز للناشرين | ملامح",
    en: "Casting & Talent Selection Guides for Publishers | MLAMH",
  },
  industry: {
    ar: "الكاستنج والإنتاج والتصوير في السعودية | ملامح",
    en: "Casting, Production & Filming in Saudi Arabia | MLAMH",
  },
  reports: {
    ar: "تقارير وأرقام السينما والكاستنج في السعودية | ملامح",
    en: "Saudi Film, Casting & Production Reports | MLAMH",
  },
  stories: {
    ar: "قصص ومقابلات من الكاستنج والإنتاج | ملامح",
    en: "Casting & Production Stories and Interviews | MLAMH",
  },
  "using-mlamh": {
    ar: "دليل استخدام منصة ملامح للمواهب والناشرين | ملامح",
    en: "How to Use MLAMH for Talent and Publishers | MLAMH",
  },
};

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

async function loadCategory(locale: "ar" | "en", slug: string) {
  const category = await SceneCMS.getPublicCategoryBySlug({ locale, slug });
  if (!category) return null;
  const articles = await SceneCMS.getPublicArticles({ locale, categoryId: category.id, limit: 60 });
  return { category, articles };
}

function SceneCategoryJsonLd({
  locale,
  category,
  articles,
}: {
  locale: "ar" | "en";
  category: ScenePublicCategory;
  articles: ScenePublicArticle[];
}) {
  const categoryUrl = `${SITE_URL}/${locale}/scene/category/${category.slug}`;
  const sceneName = locale === "ar" ? "مشهد ملامح" : "MLAMH Scene";

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${categoryUrl}#collection`,
        url: categoryUrl,
        name: `${category.name} | ${sceneName}`,
        description: category.description,
        inLanguage: locale,
        isPartOf: {
          "@type": "WebSite",
          name: "MLAMH",
          url: SITE_URL,
        },
        mainEntity: {
          "@id": `${categoryUrl}#itemlist`,
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${categoryUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "MLAMH",
            item: `${SITE_URL}/${locale}`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: sceneName,
            item: `${SITE_URL}/${locale}/scene`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: category.name,
            item: categoryUrl,
          },
        ],
      },
      {
        "@type": "ItemList",
        "@id": `${categoryUrl}#itemlist`,
        name: category.name,
        numberOfItems: articles.length,
        itemListElement: articles.map((article, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${SITE_URL}/${locale}/scene/${article.slug}`,
          name: article.title,
        })),
      },
    ],
  };

  const json = JSON.stringify(schema).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale: "ar" | "en" = rawLocale === "en" ? "en" : "ar";

  try {
    const category = await SceneCMS.getPublicCategoryBySlug({ locale, slug });
    if (!category) return {};

    const fallbackTitle = `${category.name} | ${locale === "ar" ? "مشهد ملامح" : "MLAMH Scene"}`;
    const title = CATEGORY_SEO_TITLES[category.slug]?.[locale] ?? fallbackTitle;
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
      <SceneCategoryJsonLd locale={locale} category={category} articles={articles} />

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
