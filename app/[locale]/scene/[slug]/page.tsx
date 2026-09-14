import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpLeft,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Tag,
} from "lucide-react";
import { notFound } from "next/navigation";

import { SceneArticleCard } from "@/components/scene/SceneArticleCard";
import { SceneCMS } from "@/lib/cms/SceneCMS";
import type { ScenePublicArticle } from "@/lib/types/scene";

export const revalidate = 300;

const SITE_URL = "https://mlamh.net";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

function formatDate(value: string, locale: "ar" | "en") {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(
    locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-US",
    { year: "numeric", month: "long", day: "numeric" },
  ).format(date);
}

function renderArticleContent(content: string) {
  const blocks = content
    .replaceAll("\r\n", "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block, index) => {
    if (block.startsWith("### ")) {
      return (
        <h3 key={index} className="mt-10 text-xl font-medium leading-9 text-white sm:text-2xl">
          {block.slice(4)}
        </h3>
      );
    }

    if (block.startsWith("## ")) {
      return (
        <h2 key={index} className="mt-12 text-2xl font-medium leading-10 text-white sm:text-3xl">
          {block.slice(3)}
        </h2>
      );
    }

    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);

    if (lines.length > 0 && lines.every((line) => line.startsWith("- "))) {
      return (
        <ul key={index} className="my-7 space-y-3 ps-5 text-base leading-8 text-white/72 marker:text-gold sm:text-lg">
          {lines.map((line, lineIndex) => (
            <li key={lineIndex}>{line.slice(2)}</li>
          ))}
        </ul>
      );
    }

    if (lines.length > 0 && lines.every((line) => /^\d+\.\s/.test(line))) {
      return (
        <ol key={index} className="my-7 list-decimal space-y-3 ps-6 text-base leading-8 text-white/72 marker:text-gold sm:text-lg">
          {lines.map((line, lineIndex) => (
            <li key={lineIndex}>{line.replace(/^\d+\.\s/, "")}</li>
          ))}
        </ol>
      );
    }

    return (
      <p key={index} className="my-6 whitespace-pre-line text-base leading-9 text-white/72 sm:text-lg sm:leading-10">
        {block}
      </p>
    );
  });
}

async function loadArticle(locale: "ar" | "en", slug: string) {
  const article = await SceneCMS.getPublicArticleBySlug({ locale, slug });
  if (!article) return null;

  const categories = await SceneCMS.getPublicCategories(locale);
  const category = categories.find((item) => item.id === article.categoryId) ?? null;
  const related = (
    await SceneCMS.getPublicArticles({
      locale,
      categoryId: article.categoryId,
      limit: 7,
    })
  )
    .filter((item) => item.id !== article.id)
    .slice(0, 3);

  return { article, category, related };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale: "ar" | "en" = rawLocale === "en" ? "en" : "ar";

  try {
    const article = await SceneCMS.getPublicArticleBySlug({ locale, slug });
    if (!article) return {};

    const url = `${SITE_URL}/${locale}/scene/${article.slug}`;
    const images = article.coverImageUrl
      ? [{ url: article.coverImageUrl, alt: article.coverImageAlt }]
      : undefined;

    return {
      title: article.seoTitle,
      description: article.seoDescription || article.excerpt,
      alternates: {
        canonical: url,
        languages: {
          ar: `${SITE_URL}/ar/scene/${article.slug}`,
          en: `${SITE_URL}/en/scene/${article.slug}`,
        },
      },
      openGraph: {
        title: article.seoTitle,
        description: article.seoDescription || article.excerpt,
        url,
        siteName: "MLAMH",
        type: "article",
        publishedTime: article.publishedAt,
        authors: article.authorName ? [article.authorName] : undefined,
        images,
      },
      twitter: {
        card: article.coverImageUrl ? "summary_large_image" : "summary",
        title: article.seoTitle,
        description: article.seoDescription || article.excerpt,
        images: article.coverImageUrl ? [article.coverImageUrl] : undefined,
      },
    };
  } catch {
    return {};
  }
}

function ArticleJsonLd({ article, locale }: { article: ScenePublicArticle; locale: "ar" | "en" }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.seoDescription || article.excerpt,
    inLanguage: locale,
    datePublished: article.publishedAt,
    author: {
      "@type": "Organization",
      name: article.authorName || "MLAMH",
    },
    publisher: {
      "@type": "Organization",
      name: "MLAMH",
      url: SITE_URL,
    },
    mainEntityOfPage: `${SITE_URL}/${locale}/scene/${article.slug}`,
    image: article.coverImageUrl || undefined,
  };

  const json = JSON.stringify(schema).replace(/</g, "\\u003c");

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

export default async function SceneArticlePage({ params }: PageProps) {
  const { locale: rawLocale, slug } = await params;
  const locale: "ar" | "en" = rawLocale === "en" ? "en" : "ar";
  const isArabic = locale === "ar";

  let loaded;
  try {
    loaded = await loadArticle(locale, slug);
  } catch (error) {
    console.error("[SceneArticlePage]", error);
    throw error;
  }

  if (!loaded) notFound();

  const { article, category, related } = loaded;
  const BackIcon = isArabic ? ArrowRight : ArrowLeft;
  const CtaIcon = isArabic ? ArrowUpLeft : ArrowUpRight;

  return (
    <main dir={isArabic ? "rtl" : "ltr"} className="min-h-screen bg-black text-white">
      <ArticleJsonLd article={article} locale={locale} />

      <article>
        <header className="border-b border-white/[0.07] bg-[radial-gradient(circle_at_18%_8%,rgba(212,175,55,0.14),transparent_30%)]">
          <div className="mx-auto max-w-5xl px-4 py-9 sm:px-6 md:py-14 lg:px-8">
            <Link href={category ? `/${locale}/scene/category/${category.slug}` : `/${locale}/scene`} className="inline-flex items-center gap-2 text-xs text-white/40 transition hover:text-gold">
              <BackIcon className="h-4 w-4" />
              {category?.name || (isArabic ? "مشهد ملامح" : "MLAMH Scene")}
            </Link>

            <div className="mt-9 flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-gold/80">
              <span>MLAMH SCENE</span>
              {category ? <span className="text-white/25">/</span> : null}
              {category ? <span className="normal-case tracking-normal text-white/45">{category.name}</span> : null}
            </div>

            <h1 className="mt-5 text-4xl font-light leading-[1.35] sm:text-5xl md:text-6xl md:leading-[1.3]">
              {article.title}
            </h1>

            {article.excerpt ? (
              <p className="mt-6 max-w-4xl text-base leading-8 text-white/52 sm:text-xl sm:leading-9">
                {article.excerpt}
              </p>
            ) : null}

            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-white/[0.07] pt-5 text-xs text-white/38">
              {article.authorName ? <span>{article.authorName}</span> : null}
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDate(article.publishedAt, locale)}
              </span>
              {article.readTimeMinutes ? (
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-3.5 w-3.5" />
                  {isArabic ? `${article.readTimeMinutes} دقائق قراءة` : `${article.readTimeMinutes} min read`}
                </span>
              ) : null}
            </div>
          </div>
        </header>

        {article.coverImageUrl ? (
          <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 md:pt-12 lg:px-8">
            <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.02] sm:rounded-[2.25rem]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={article.coverImageUrl} alt={article.coverImageAlt} className="aspect-[16/8.5] w-full object-cover" />
            </div>
          </div>
        ) : null}

        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
          <div>{renderArticleContent(article.content)}</div>

          {article.tags.length > 0 ? (
            <div className="mt-12 flex flex-wrap items-center gap-2 border-t border-white/[0.07] pt-7">
              <Tag className="h-4 w-4 text-gold/70" />
              {article.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 bg-white/[0.025] px-3 py-1.5 text-xs text-white/45">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          {article.ctaHref && article.ctaLabel ? (
            <div className="mt-12 rounded-[1.75rem] border border-gold/20 bg-gold/[0.055] p-6 sm:p-8">
              <p className="text-[10px] uppercase tracking-[0.28em] text-gold">MLAMH</p>
              <h2 className="mt-3 text-2xl font-light sm:text-3xl">
                {isArabic ? "الخطوة التالية" : "Next step"}
              </h2>
              <Link href={article.ctaHref} className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold px-5 py-3 text-sm font-medium text-black transition hover:bg-gold-soft">
                {article.ctaLabel}
                <CtaIcon className="h-4 w-4" />
              </Link>
            </div>
          ) : null}
        </div>
      </article>

      {related.length > 0 ? (
        <section className="border-t border-white/[0.07]">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.32em] text-gold">MLAMH SCENE</p>
                <h2 className="mt-2 text-2xl font-light sm:text-3xl">
                  {isArabic ? "مواضيع ذات صلة" : "Related articles"}
                </h2>
              </div>
              {category ? (
                <Link href={`/${locale}/scene/category/${category.slug}`} className="text-xs text-white/40 transition hover:text-gold">
                  {isArabic ? "عرض القسم" : "View category"}
                </Link>
              ) : null}
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <SceneArticleCard key={item.id} article={item} locale={locale} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
