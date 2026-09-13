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
    title: isRtl ? "طلبات الآن للممثلين والمودلز | ملامح" : "Quick Talent Requests | MLAMH",
    description: isRtl
      ? "اكتشف طلبات سريعة تحتاج ممثلين ومودلز في السعودية عبر ملامح."
      : "Discover quick requests for actors and models in Saudi Arabia on MLAMH.",
  };
}

export default async function QuickOpportunitiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === "en" ? "en" : "ar";
  return <PublicOpportunityModeDirectory locale={locale} mode="quick" />;
}
