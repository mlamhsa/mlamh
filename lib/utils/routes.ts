import { TALENTS_ROUTE } from "@/lib/constants/routes";
import type { Locale } from "@/lib/i18n";

export function talentPath(
  locale: Locale,
  slug?: string | number | null
) {
  if (!slug) {
    return `/${locale}${TALENTS_ROUTE}`;
  }

  return `/${locale}${TALENTS_ROUTE}/${slug}`;
}