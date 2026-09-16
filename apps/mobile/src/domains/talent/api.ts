import { mobileApiRequest } from "@/src/api/client";
import type { AppLocale } from "@/src/i18n/locale";
import type { MobileTalentDirectoryResponse, MobilePublicTalent } from "@/src/domains/talent/types";

type TalentDirectoryQuery = {
  page?: number;
  pageSize?: number;
  q?: string;
  category?: string;
  city?: string;
};

function queryString(locale: AppLocale, query: TalentDirectoryQuery) {
  const params = new URLSearchParams();
  params.set("locale", locale);
  params.set("page", String(query.page ?? 1));
  params.set("pageSize", String(query.pageSize ?? 20));
  if (query.q?.trim()) params.set("q", query.q.trim());
  if (query.category?.trim()) params.set("category", query.category.trim());
  if (query.city?.trim()) params.set("city", query.city.trim());
  return params.toString();
}

export function getMobileTalents(
  locale: AppLocale,
  queryOrPageSize: TalentDirectoryQuery | number = { pageSize: 6 },
) {
  const query = typeof queryOrPageSize === "number" ? { pageSize: queryOrPageSize } : queryOrPageSize;
  return mobileApiRequest<MobileTalentDirectoryResponse>(
    `/api/mobile/talents?${queryString(locale, query)}`,
    { authenticated: false },
  );
}

export type MobileTalentProfileResponse =
  | { ok: true; item: MobilePublicTalent }
  | { ok: false; code: string };

export function getMobileTalentProfile(locale: AppLocale, slug: string) {
  return mobileApiRequest<MobileTalentProfileResponse>(
    `/api/mobile/talents/${encodeURIComponent(slug)}?locale=${locale}`,
    { authenticated: false },
  );
}
