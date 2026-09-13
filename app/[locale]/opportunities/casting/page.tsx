import type { Metadata } from "next";

import PublicOpportunityModeDirectory from "@/components/opportunities/PublicOpportunityModeDirectory";
import { isValidLocale, type Locale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isValidLocale(rawLocale) ? (rawLocale as Locale) : "ar";
  const isRtl = locale === "ar";
  return {
    title: isRtl ? "فرص الكاستينغ والتمثيل والمودل | ملامح" : "Casting Opportunities | MLAMH",
    description: isRtl
      ? "اكتشف فرص الكاستينغ والمشاريع للممثلين والمودلز في السعودية عبر ملامح."
      : "Discover casting opportunities and projects for actors and models in Saudi Arabia on MLAMH.",
  };
}

export default async function CastingOpportunitiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === "en" ? "en" : "ar";
  return <PublicOpportunityModeDirectory locale={locale} mode="project" />;
}
