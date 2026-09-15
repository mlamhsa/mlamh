import { mobileApiRequest } from "@/src/api/client";
import type { AppLocale } from "@/src/i18n/locale";
import type { TalentApplicationsResponse } from "@/src/domains/applications/types";

export function getTalentApplications(locale: AppLocale) {
  return mobileApiRequest<TalentApplicationsResponse>(`/api/applications/mine?locale=${locale}`);
}
