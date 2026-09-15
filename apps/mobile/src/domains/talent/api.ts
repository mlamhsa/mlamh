import { mobileApiRequest } from "@/src/api/client";
import type { AppLocale } from "@/src/i18n/locale";
import type { MobileTalentDirectoryResponse } from "@/src/domains/talent/types";

export function getMobileTalents(locale: AppLocale, pageSize = 6) {
  return mobileApiRequest<MobileTalentDirectoryResponse>(
    `/api/mobile/talents?locale=${locale}&page=1&pageSize=${pageSize}`,
  );
}
