import { mobileApiRequest } from "@/src/api/client";
import type { AppLocale } from "@/src/i18n/locale";
import type {
  MobileOpportunitiesResponse,
  MobileOpportunityDetailResponse,
  MobileOpportunityResponseResult,
} from "@/src/domains/opportunities/types";

export function getMobileOpportunities(locale: AppLocale, market = "SA") {
  return mobileApiRequest<MobileOpportunitiesResponse>(
    `/api/opportunities?locale=${locale}&market=${market}`,
    { authenticated: false },
  );
}

export function getMobileOpportunity(identifier: string, locale: AppLocale, market = "SA") {
  return mobileApiRequest<MobileOpportunityDetailResponse>(
    `/api/opportunities/${encodeURIComponent(identifier)}?locale=${locale}&market=${market}`,
    { authenticated: false },
  );
}

export function respondToMobileOpportunity(opportunityId: number, locale: AppLocale) {
  return mobileApiRequest<MobileOpportunityResponseResult>(
    `/api/opportunities/${opportunityId}/apply?locale=${locale}`,
    { method: "POST" },
  );
}
