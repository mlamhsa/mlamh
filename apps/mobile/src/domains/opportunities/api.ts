import { mobileApiRequest } from "@/src/api/client";
import type { AppLocale } from "@/src/i18n/locale";
import type { MobileOpportunitiesResponse } from "@/src/domains/opportunities/types";

export function getMobileOpportunities(locale: AppLocale, market = "SA") {
  return mobileApiRequest<MobileOpportunitiesResponse>(
    `/api/opportunities?locale=${locale}&market=${market}`,
    { authenticated: false },
  );
}
