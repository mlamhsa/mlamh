import { notFound, permanentRedirect } from "next/navigation";

import { isValidLocale, type Locale } from "@/lib/i18n";

const MIGRATED_GUIDES = new Set([
  "how-to-start-acting-saudi-arabia",
  "how-to-start-modeling-saudi-arabia",
  "casting-auditions-saudi-arabia",
]);

export default async function LegacyGuideRedirect({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;

  if (!isValidLocale(rawLocale) || !MIGRATED_GUIDES.has(slug)) {
    notFound();
  }

  const locale = rawLocale as Locale;
  permanentRedirect(`/${locale}/scene/${slug}`);
}
