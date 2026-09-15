import { mobileApiRequest } from "@/src/api/client";
import type { AppLocale } from "@/src/i18n/locale";
import type { MobileOpportunitiesResponse, MobilePublicOpportunity } from "@/src/domains/opportunities/types";

export function getMobileOpportunities(locale: AppLocale, market = "SA") {
  return mobileApiRequest<MobileOpportunitiesResponse>(
    `/api/opportunities?locale=${locale}&market=${market}`,
    { authenticated: false },
  );
}

export function getMobileOpportunity(identifier: string, locale: AppLocale, market = "SA") {
  return mobileApiRequest<{ item: MobilePublicOpportunity; market: string; locale: "ar" | "en" }>(
    `/api/opportunities/${encodeURIComponent(identifier)}?locale=${locale}&market=${market}`,
    { authenticated: false },
  );
}
