import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TalentSeoLanding } from "@/components/public/TalentSeoLanding";
import { getSaudiCityBySlug } from "@/lib/data/saudi-cities";
import { TALENT_CATEGORIES, getTalentCategoryBySlug } from "@/lib/data/talent-categories";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { getPublicTalents } from "@/lib/supabase/public-talents";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://mlamh.net").replace(/\/$/, "");
const INDEXABLE_CATEGORIES = new Set(TALENT_CATEGORIES.map((item) => item.slug));

type PageProps = {
  params: Promise<{ locale: string; category: string; city: string }>;
};

function categoryLabel(category: "actor" | "model", locale: Locale) {
  if (locale === "ar") {
    return category === "model" ? "مودلز" : "ممثلين";
  }
  return category === "model" ? "Models" : "Actors";
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale, category, city } = await params;
  if (!isValidLocale(rawLocale) || !INDEXABLE_CATEGORIES.has(category)) return {};

  const locale = rawLocale as Locale;
  const categoryItem = getTalentCategoryBySlug(category);
  const cityItem = getSaudiCityBySlug(city);
  if (!categoryItem || !cityItem) return {};

  const { talents } = await getPublicTalents({ category, city, pageSize: 1 });
  const hasPublishedSupply = talents.length > 0;
  const isArabic = locale === "ar";
  const cityName = isArabic ? cityItem.ar : cityItem.en;
  const categoryName = categoryLabel(category as "actor" | "model", locale);
  const title = isArabic
    ? `${categoryName} ${cityName} | كاستنج ومواهب في ${cityName} | ملامح`
    : `${categoryName} in ${cityName} | Casting & Talent | MLAMH`;
  const description = isArabic
    ? `استعرض ${categoryName} المنشورين والمعتمدين في ${cityName} عبر ملامح لمشاريع الإعلانات والتصوير والكاستنج والمحتوى والفعاليات.`
    : `Browse published and approved ${categoryName.toLowerCase()} in ${cityName} on MLAMH for casting, advertising, shoots, content and events.`;
  const canonical = `${SITE_URL}/${locale}/talent/category/${category}/city/${city}`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        "ar-SA": `${SITE_URL}/ar/talent/category/${category}/city/${city}`,
        en: `${SITE_URL}/en/talent/category/${category}/city/${city}`,
        "x-default": `${SITE_URL}/ar/talent/category/${category}/city/${city}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      siteName: "MLAMH",
      images: [`${SITE_URL}/og-image.png`],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${SITE_URL}/og-image.png`],
    },
    robots: hasPublishedSupply
      ? { index: true, follow: true }
      : { index: false, follow: true },
  };
}

export default async function TalentCategoryCityPage({ params }: PageProps) {
  const { locale: rawLocale, category, city } = await params;
  if (!isValidLocale(rawLocale) || !INDEXABLE_CATEGORIES.has(category)) notFound();

  const locale = rawLocale as Locale;
  const categoryItem = getTalentCategoryBySlug(category);
  const cityItem = getSaudiCityBySlug(city);
  if (!categoryItem || !cityItem) notFound();

  const { talents } = await getPublicTalents({ category, city, pageSize: 48 });
  const isArabic = locale === "ar";
  const cityName = isArabic ? cityItem.ar : cityItem.en;
  const categoryName = categoryLabel(category as "actor" | "model", locale);
  const canonical = `${SITE_URL}/${locale}/talent/category/${category}/city/${city}`;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: isArabic ? "ملامح" : "MLAMH",
        item: `${SITE_URL}/${locale}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: isArabic ? "المواهب" : "Talents",
        item: `${SITE_URL}/${locale}/talent`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: isArabic ? `${categoryName} في السعودية` : `${categoryName} in Saudi Arabia`,
        item: `${SITE_URL}/${locale}/talent/category/${category}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: isArabic ? `${categoryName} ${cityName}` : `${categoryName} in ${cityName}`,
        item: canonical,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <TalentSeoLanding
        locale={locale}
        eyebrow={isArabic ? "مواهب حسب التخصص والمدينة" : "TALENTS BY ROLE & CITY"}
        title={isArabic ? `${categoryName} في ${cityName}` : `${categoryName} in ${cityName}`}
        description={
          isArabic
            ? `استعرض ملفات ${categoryName} المنشورة والمعتمدة في ${cityName}. هذه الصفحة تعرض فقط الملفات العامة، بينما الملفات الخاصة والمقيدة تبقى خارج نتائج البحث العامة.`
            : `Browse published and approved ${categoryName.toLowerCase()} in ${cityName}. This page only shows public profiles; private and restricted profiles stay out of public search.`
        }
        talents={talents}
      />
    </>
  );
}
