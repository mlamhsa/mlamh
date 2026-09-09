import { MOBILE_API_BASE_URL } from "@/lib/api-config";
import type { AppLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";

export type MobilePublicTalent = {
  id: number;
  slug: string;
  name: string;
  role: "actor" | "model" | null;
  city: string | null;
  countryCode: string | null;
  imageUrl: string | null;
  featured: boolean;
  verified: boolean;
  gender: string | null;
  nationality: string | null;
  age: number | null;
  heightCm: number | null;
  bio: string | null;
  languages: string[];
  dialects: string[];
  skills: string[];
  experienceYears: number | null;
  availabilityStatus: string | null;
  readyToTravel: boolean | null;
};

export type MobileTalentDetail = MobilePublicTalent & {
  /** Returned only by the detail endpoint after photo-visibility policy is applied. */
  galleryImages: string[];
};

export type TalentAccessSummary = {
  tier: "visitor" | "publisher_basic" | "publisher_approved" | "publisher_verified" | "publisher_trusted";
  approved: boolean;
  verified: boolean;
  canInviteToOpportunity: boolean;
  contactDetailsProtected: true;
  bulkExportAllowed: false;
};

export type TalentDirectoryFilters = {
  q?: string;
  category?: "actor" | "model" | "";
  city?: string;
  gender?: "male" | "female" | "";
  nationality?: string;
  ageMin?: string;
  ageMax?: string;
  heightMin?: string;
  heightMax?: string;
  language?: string;
  dialect?: string;
  skill?: string;
  availability?: string;
  readyToTravel?: "true" | "";
  page?: number;
  pageSize?: number;
};

function append(params: URLSearchParams, key: string, value: string | number | undefined) {
  if (value === undefined || value === "") return;
  params.set(key, String(value));
}
function safePositiveInteger(value: unknown, fallback: number) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? Math.floor(numeric) : fallback;
}
async function readJson(response: Response) {
  const raw = await response.text().catch(() => "");
  if (!raw) return null;
  try { return JSON.parse(raw) as unknown; } catch { return null; }
}
async function viewerHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = { Accept: "application/json" };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  return headers;
}

export async function getMobileTalents(locale: AppLocale, filters: TalentDirectoryFilters = {}) {
  const params = new URLSearchParams();
  params.set("locale", locale);
  append(params, "q", filters.q?.trim());
  append(params, "category", filters.category);
  append(params, "city", filters.city?.trim());
  append(params, "gender", filters.gender);
  append(params, "nationality", filters.nationality?.trim());
  append(params, "ageMin", filters.ageMin?.trim());
  append(params, "ageMax", filters.ageMax?.trim());
  append(params, "heightMin", filters.heightMin?.trim());
  append(params, "heightMax", filters.heightMax?.trim());
  append(params, "language", filters.language?.trim());
  append(params, "dialect", filters.dialect?.trim());
  append(params, "skill", filters.skill?.trim());
  append(params, "availability", filters.availability?.trim());
  append(params, "readyToTravel", filters.readyToTravel);
  append(params, "page", filters.page ?? 1);
  const pageSize = Math.min(40, Math.max(1, Math.floor(filters.pageSize ?? 20)));
  params.set("pageSize", String(pageSize));

  let response: Response;
  try { response = await fetch(`${MOBILE_API_BASE_URL}/api/mobile/talents?${params.toString()}`, { headers: await viewerHeaders() }); }
  catch { throw new Error("NETWORK_UNAVAILABLE"); }
  const parsed = await readJson(response);
  const payload = parsed && typeof parsed === "object" ? parsed as { ok?: boolean; items?: MobilePublicTalent[]; total?: number; totalPages?: number; currentPage?: number; code?: string; access?: TalentAccessSummary } : {};
  if (!response.ok || payload.ok !== true) throw new Error(payload.code || `TALENT_DIRECTORY_FAILED:${response.status}`);
  return {
    items: Array.isArray(payload.items) ? payload.items : [],
    total: Math.max(0, Number.isFinite(Number(payload.total)) ? Number(payload.total) : 0),
    totalPages: safePositiveInteger(payload.totalPages, 1),
    currentPage: safePositiveInteger(payload.currentPage, 1),
    access: payload.access ?? null,
  };
}

export async function getMobileTalent(locale: AppLocale, slug: string): Promise<MobileTalentDetail> {
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) throw new Error("INVALID_TALENT_SLUG");
  let response: Response;
  try { response = await fetch(`${MOBILE_API_BASE_URL}/api/mobile/talents/${encodeURIComponent(normalizedSlug)}?locale=${locale}`, { headers: await viewerHeaders() }); }
  catch { throw new Error("NETWORK_UNAVAILABLE"); }
  const parsed = await readJson(response);
  const payload = parsed && typeof parsed === "object" ? parsed as { ok?: boolean; item?: MobileTalentDetail; code?: string } : {};
  if (!response.ok || payload.ok !== true || !payload.item) throw new Error(payload.code || `TALENT_LOOKUP_FAILED:${response.status}`);
  return { ...payload.item, galleryImages: Array.isArray(payload.item.galleryImages) ? payload.item.galleryImages : [] };
}
