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

  const { talents } = await getPublicTalents({ city, pageSize: 1 });
  const hasPublishedSupply = talents.length > 0;
  const isArabic = locale === "ar";
  const label = isArabic ? item.ar : item.en;
  const title = isArabic
    ? `ممثلون ومودلز في ${label} | ملامح`
    : `Actors & Models in ${label} | MLAMH`;
  const description = isArabic
    ? `اكتشف الممثلين والمودلز المنشورين في ${label} عبر منصة ملامح، واستعرض الملفات المهنية والصور لمشاريع الكاستينج والإعلانات.`
    : `Discover published actors and models in ${label} on MLAMH for casting, advertising and production projects.`;
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
    robots: { index: hasPublishedSupply, follow: true },
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
      title={isArabic ? `ممثلون ومودلز في ${label}` : `Actors & Models in ${label}`}
      description={
        isArabic
          ? `استعرض ملفات الممثلين والمودلز المنشورة في ${label} واختر المواهب المناسبة لمشروع الكاستينج أو التصوير أو الإعلان.`
          : `Browse published actors and models in ${label} and find talent for casting, shoots, advertising and production projects.`
      }
      talents={talents}
    />
  );
}
