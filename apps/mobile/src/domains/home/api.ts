import { mobileApiRequest } from "@/src/api/client";
import type { AppLocale } from "@/src/i18n/locale";
import type { MobileHomeResponse } from "@/src/domains/home/types";

export function getMobileHome(locale: AppLocale) {
  return mobileApiRequest<MobileHomeResponse>(`/api/mobile/home?locale=${locale}`);
}
