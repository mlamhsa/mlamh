import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TalentSeoLanding } from "@/components/public/TalentSeoLanding";
import { getSaudiCityBySlug } from "@/lib/data/saudi-cities";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { getPublicTalents } from "@/lib/supabase/public-talents";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://mlamh.net").replace(/\/$/, "");

type PageProps = {
  params: Promise<{ locale: string; city: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale, city } = await params;
  if (!isValidLocale(rawLocale)) return {};

  const locale = rawLocale as Locale;
  const item = getSaudiCityBySlug(city);
  if (!item) return {};

  const isArabic = locale === "ar";
  const label = isArabic ? item.ar : item.en;
  const title = isArabic
    ? `مواهب وممثلون ومودلز في ${label} | ملامح`
    : `Actors & Models in ${label} | MLAMH`;
  const description = isArabic
    ? `اكتشف المواهب والممثلين والمودلز المنشورين في ${label} عبر منصة ملامح، واستعرض الملفات المهنية والصور لمشاريع الكاستينج والإعلانات.`
    : `Discover actors, models and published talent profiles in ${label} on MLAMH for casting, advertising and production projects.`;
  const canonical = `${SITE_URL}/${locale}/talent/city/${city}`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        "ar-SA": `${SITE_URL}/ar/talent/city/${city}`,
        en: `${SITE_URL}/en/talent/city/${city}`,
        "x-default": `${SITE_URL}/ar/talent/city/${city}`,
      },
    },
    openGraph: { title, description, url: canonical, type: "website", siteName: "MLAMH" },
    robots: { index: true, follow: true },
  };
}

export default async function TalentCityPage({ params }: PageProps) {
  const { locale: rawLocale, city } = await params;
  if (!isValidLocale(rawLocale)) notFound();

  const locale = rawLocale as Locale;
  const item = getSaudiCityBySlug(city);
  if (!item) notFound();

  const { talents } = await getPublicTalents({ city, pageSize: 48 });
  const isArabic = locale === "ar";
  const label = isArabic ? item.ar : item.en;

  return (
    <TalentSeoLanding
      locale={locale}
      eyebrow={isArabic ? "مواهب حسب المدينة" : "TALENTS BY CITY"}
      title={isArabic ? `مواهب في ${label}` : `Talents in ${label}`}
      description={
        isArabic
          ? `استعرض ملفات المواهب المنشورة في ${label} واختر الممثلين والمودلز المناسبين لمشروعك.`
          : `Browse published talent profiles in ${label} and find actors and models for your next project.`
      }
      talents={talents}
    />
  );
}
