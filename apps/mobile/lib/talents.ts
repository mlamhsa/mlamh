import { MOBILE_API_BASE_URL } from "@/lib/api-config";
import type { AppLocale } from "@/lib/i18n";

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
  page?: number;
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
  append(params, "page", filters.page ?? 1);
  params.set("pageSize", "20");

  let response: Response;
  try {
    response = await fetch(`${MOBILE_API_BASE_URL}/api/mobile/talents?${params.toString()}`, { headers: { Accept: "application/json" } });
  } catch {
    throw new Error("NETWORK_UNAVAILABLE");
  }

  const parsed = await readJson(response);
  const payload = parsed && typeof parsed === "object" ? parsed as { ok?: boolean; items?: MobilePublicTalent[]; total?: number; totalPages?: number; currentPage?: number; code?: string } : {};
  if (!response.ok || payload.ok !== true) throw new Error(payload.code || `TALENT_DIRECTORY_FAILED:${response.status}`);

  return {
    items: Array.isArray(payload.items) ? payload.items : [],
    total: Math.max(0, Number.isFinite(Number(payload.total)) ? Number(payload.total) : 0),
    totalPages: safePositiveInteger(payload.totalPages, 1),
    currentPage: safePositiveInteger(payload.currentPage, 1),
  };
}

export async function getMobileTalent(locale: AppLocale, slug: string) {
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) throw new Error("INVALID_TALENT_SLUG");

  let response: Response;
  try {
    response = await fetch(`${MOBILE_API_BASE_URL}/api/mobile/talents/${encodeURIComponent(normalizedSlug)}?locale=${locale}`, { headers: { Accept: "application/json" } });
  } catch {
    throw new Error("NETWORK_UNAVAILABLE");
  }

  const parsed = await readJson(response);
  const payload = parsed && typeof parsed === "object" ? parsed as { ok?: boolean; item?: MobilePublicTalent; code?: string } : {};
  if (!response.ok || payload.ok !== true || !payload.item) throw new Error(payload.code || `TALENT_LOOKUP_FAILED:${response.status}`);
  return payload.item;
}
