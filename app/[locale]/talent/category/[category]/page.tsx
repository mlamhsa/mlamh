import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TalentSeoLanding } from "@/components/public/TalentSeoLanding";
import { getTalentCategoryBySlug } from "@/lib/data/talent-categories";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { getPublicTalents } from "@/lib/supabase/public-talents";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://mlamh.net").replace(/\/$/, "");
const INDEXABLE_CATEGORIES = new Set(["actor", "model"]);

type PageProps = {
  params: Promise<{ locale: string; category: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale, category } = await params;
  if (!isValidLocale(rawLocale) || !INDEXABLE_CATEGORIES.has(category)) return {};

  const locale = rawLocale as Locale;
  const item = getTalentCategoryBySlug(category);
  if (!item) return {};

  const isArabic = locale === "ar";
  const label = isArabic ? item.ar : item.en;
  const title = isArabic
    ? `${label} في السعودية | دليل المواهب | ملامح`
    : `${label}s in Saudi Arabia | MLAMH Talent Directory`;
  const description = isArabic
    ? `اكتشف ${label} معتمدين في السعودية عبر منصة ملامح، واستعرض الملفات والصور والمعلومات المهنية لاختيار الموهبة المناسبة لمشروعك.`
    : `Discover approved ${label.toLowerCase()} profiles in Saudi Arabia on MLAMH and review professional details and media for your project.`;
  const canonical = `${SITE_URL}/${locale}/talent/category/${category}`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        "ar-SA": `${SITE_URL}/ar/talent/category/${category}`,
        en: `${SITE_URL}/en/talent/category/${category}`,
        "x-default": `${SITE_URL}/ar/talent/category/${category}`,
      },
    },
    openGraph: { title, description, url: canonical, type: "website", siteName: "MLAMH" },
    robots: { index: true, follow: true },
  };
}

export default async function TalentCategoryPage({ params }: PageProps) {
  const { locale: rawLocale, category } = await params;
  if (!isValidLocale(rawLocale) || !INDEXABLE_CATEGORIES.has(category)) notFound();

  const locale = rawLocale as Locale;
  const item = getTalentCategoryBySlug(category);
  if (!item) notFound();

  const { talents } = await getPublicTalents({ category, pageSize: 48 });
  const isArabic = locale === "ar";
  const label = isArabic ? item.ar : item.en;

  return (
    <TalentSeoLanding
      locale={locale}
      eyebrow={isArabic ? "دليل المواهب" : "TALENT DIRECTORY"}
      title={isArabic ? `${label} في السعودية` : `${label}s in Saudi Arabia`}
      description={
        isArabic
          ? `استعرض ملفات ${label} المنشورة والمعتمدة على ملامح وابحث عن الوجوه المناسبة للإعلانات والإنتاج والكاستينج.`
          : `Browse approved ${label.toLowerCase()} profiles on MLAMH for casting, advertising and production projects.`
      }
      talents={talents}
    />
  );
}
