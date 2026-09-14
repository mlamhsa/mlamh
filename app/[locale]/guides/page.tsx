import { permanentRedirect } from "next/navigation";

import { isValidLocale, type Locale } from "@/lib/i18n";

export default async function LegacyGuidesRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isValidLocale(rawLocale) ? rawLocale : "ar";

  permanentRedirect(`/${locale}/scene`);
}
