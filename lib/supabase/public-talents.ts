import { getCachedValue } from "@/lib/cache/public-talents";
import type { CountryCode } from "@/lib/markets/countries";
import {
  canExposePublicMarket,
  canExposePublicTalent,
} from "@/lib/markets/public-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  canViewTalentPrivateContent,
  grantTalentPrivateContent,
  hideTalentPrivateContent,
} from "@/lib/talent/public-profile-access";
import {
  isTalentPubliclyVisible,
  type TalentQualificationInput,
} from "@/lib/talent/qualification";
import type { Talent } from "@/lib/types/talent";

type GetPublicTalentsOptions = {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  city?: string;
  countryCode?: CountryCode;
};

type GetPublicTalentsResult = {
  talents: Talent[];
  total: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
};

type PublicTalentCandidate = Talent & {
  primary_role?: string | null;
  profile_approval_status?: string | null;
  profile_status?: string | null;
};

const DEFAULT_PUBLIC_MARKET: CountryCode = "SA";
const PUBLIC_DIRECTORY_BATCH_SIZE = 100;

const CATEGORY_ALIASES: Record<string, string[]> = {
  actor: ["actor", "actors", "acting", "ممثل", "ممثلون", "تمثيل"],
  model: ["model", "models", "modeling", "مودل", "مودلز", "عارض", "عارضة"],
  content_creator: ["content_creator", "creator", "creators", "content creator", "content creators", "صانع محتوى", "صناع محتوى", "محتوى"],
  presenter: ["presenter", "presenters", "host", "hosts", "tv host", "مقدم", "مقدمة", "مقدمو برامج", "تقديم", "إعلام"],
  voice_actor: ["voice_actor", "voice", "voice over", "voiceover", "voice artist", "voice artists", "تعليق صوتي", "معلق صوتي", "معلقون صوتيون"],
  singer: ["singer", "singers", "مغني", "مغنون", "غناء"],
  dancer: ["dancer", "dancers", "راقص", "راقصون", "رقص"],
  athlete: ["athlete", "athletes", "رياضي", "رياضيون"],
  extra: ["extra", "extras", "background", "كومبارس"],
  influencer: ["influencer", "influencers", "مؤثر", "مؤثرون"],
};

function normalizeSearchValue(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeSlug(value: string) {
  let normalized = value.trim();
  try {
    normalized = decodeURIComponent(normalized);
  } catch {
    // Next.js may already provide a decoded slug.
  }
  return normalized.trim();
}

function getCategorySearchTerms(category?: string) {
  const normalizedCategory = normalizeSearchValue(category);
  if (!normalizedCategory) return [];
  const normalizedKey = normalizedCategory.toLowerCase();
  return CATEGORY_ALIASES[normalizedKey] ?? [normalizedCategory];
}

function includesTerm(value: unknown, terms: string[]) {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  return normalized ? terms.some((term) => normalized.includes(term.toLowerCase())) : false;
}

function matchesSearch(talent: Talent, term?: string) {
  if (!term) return true;
  return [
    talent.name_en,
    talent.name_ar,
    talent.display_name_en,
    talent.display_name_ar,
    talent.category_slug,
    talent.category_en,
    talent.category_ar,
    talent.city_slug,
    talent.city_en,
    talent.city_ar,
  ].some((value) => includesTerm(value, [term]));
}

function matchesCategory(talent: Talent, category?: string) {
  if (!category) return true;
  const terms = getCategorySearchTerms(category);
  return (
    String(talent.category_slug ?? "").trim().toLowerCase() === category.toLowerCase() ||
    includesTerm(talent.category_en, terms) ||
    includesTerm(talent.category_ar, terms)
  );
}

function matchesCity(talent: Talent, city?: string) {
  if (!city) return true;
  const normalizedCity = city.toLowerCase();
  return (
    String(talent.city_slug ?? "").trim().toLowerCase() === normalizedCity ||
    includesTerm(talent.city_en, [city]) ||
    includesTerm(talent.city_ar, [city])
  );
}

function applyTalentMarketFilter<T extends { or: Function; eq: Function }>(
  query: T,
  countryCode: CountryCode,
): T {
  return (countryCode === "SA"
    ? query.or("base_country_code.eq.SA,base_country_code.is.null")
    : query.eq("base_country_code", countryCode)) as T;
}

function toPublicTalent(candidate: PublicTalentCandidate): Talent {
  const {
    profile_approval_status: _profileApprovalStatus,
    profile_status: _profileStatus,
    primary_role: _primaryRole,
    ...talent
  } = candidate;

  return hideTalentPrivateContent(talent as Talent);
}

function toPrivateTalent(candidate: PublicTalentCandidate): Talent {
  const {
    profile_approval_status: _profileApprovalStatus,
    profile_status: _profileStatus,
    primary_role: _primaryRole,
    ...talent
  } = candidate;

  return grantTalentPrivateContent(talent as Talent);
}

async function attachProfileApprovalContext(talents: Talent[]): Promise<PublicTalentCandidate[]> {
  if (talents.length === 0) return [];
  const supabase = createAdminClient();
  const userIds = talents
    .map((talent) => talent.user_id?.trim())
    .filter((value): value is string => Boolean(value));

  const profileByUserId = new Map<string, { approval_status: string | null; status: string | null }>();
  if (userIds.length > 0) {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("user_id, approval_status, status")
      .in("user_id", userIds);
    if (error) throw new Error(`[public-talents:profiles] ${error.message}`);
    for (const profile of profiles ?? []) {
      profileByUserId.set(profile.user_id, {
        approval_status: profile.approval_status,
        status: profile.status,
      });
    }
  }

  return talents.map((talent) => {
    const profile = talent.user_id ? profileByUserId.get(talent.user_id) : undefined;
    return {
      ...talent,
      profile_approval_status: profile?.approval_status,
      profile_status: profile?.status,
    };
  });
}

export function passesPublicTalentVisibilityPolicy(talent: TalentQualificationInput) {
  return isTalentPubliclyVisible(talent);
}

type VisiblePublishedCandidateOptions = {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  city?: string;
  countryCode?: CountryCode;
  collectAll?: boolean;
};

async function getVisiblePublishedCandidates({
  page = 1,
  pageSize = 12,
  search,
  category,
  city,
  countryCode = DEFAULT_PUBLIC_MARKET,
  collectAll = false,
}: VisiblePublishedCandidateOptions = {}): Promise<{ talents: Talent[]; total: number }> {
  if (!canExposePublicMarket(countryCode, "publicTalentDirectory")) return { talents: [], total: 0 };

  const supabase = createAdminClient();
  const targetFrom = (page - 1) * pageSize;
  const targetTo = targetFrom + pageSize;
  const talents: Talent[] = [];
  let total = 0;
  let offset = 0;

  while (true) {
    let query = supabase
      .from("talents")
      .select("*")
      .eq("published", true)
      .in("status", ["approved", "active"])
      .or("primary_role.in.(actor,model),category_slug.in.(actor,model)");
    query = applyTalentMarketFilter(query, countryCode);

    const { data, error } = await query
      .order("featured", { ascending: false, nullsFirst: false })
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("id", { ascending: false })
      .range(offset, offset + PUBLIC_DIRECTORY_BATCH_SIZE - 1);

    if (error) throw new Error(`[public-talents:candidates] ${error.message}`);
    const rows = (data ?? []) as Talent[];
    const candidates = await attachProfileApprovalContext(rows);

    for (const candidate of candidates) {
      if (
        !canExposePublicTalent(candidate, countryCode) ||
        !passesPublicTalentVisibilityPolicy(candidate) ||
        !matchesSearch(candidate, search) ||
        !matchesCategory(candidate, category) ||
        !matchesCity(candidate, city)
      ) continue;

      if (collectAll || (total >= targetFrom && total < targetTo)) {
        talents.push(toPublicTalent(candidate));
      }
      total += 1;
    }

    if (rows.length < PUBLIC_DIRECTORY_BATCH_SIZE) break;
    offset += PUBLIC_DIRECTORY_BATCH_SIZE;
  }

  return { talents, total };
}

async function qualifySingleTalentCandidate(
  talent: Talent | null,
  countryCode: CountryCode = DEFAULT_PUBLIC_MARKET,
): Promise<PublicTalentCandidate | null> {
  if (!talent || !canExposePublicTalent(talent, countryCode)) return null;
  const [candidate] = await attachProfileApprovalContext([talent]);
  return candidate && passesPublicTalentVisibilityPolicy(candidate) ? candidate : null;
}

async function getPublishedTalentCandidateBySlug(
  slug: string,
  countryCode: CountryCode = DEFAULT_PUBLIC_MARKET,
): Promise<PublicTalentCandidate | null> {
  if (!canExposePublicMarket(countryCode, "publicTalentDirectory")) return null;

  const normalizedSlug = normalizeSlug(slug);
  const supabase = createAdminClient();
  let query = supabase
    .from("talents")
    .select("*")
    .eq("slug", normalizedSlug)
    .eq("published", true);
  query = applyTalentMarketFilter(query, countryCode);
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(`[getPublishedTalentBySlug] ${error.message}`);
  return qualifySingleTalentCandidate(data as Talent | null, countryCode);
}

export async function getPublicTalents({
  page = 1,
  pageSize = 12,
  search,
  category,
  city,
  countryCode = DEFAULT_PUBLIC_MARKET,
}: GetPublicTalentsOptions = {}): Promise<GetPublicTalentsResult> {
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(pageSize, 1), 48);
  const normalizedSearch = normalizeSearchValue(search);
  const normalizedCategory = normalizeSearchValue(category);
  const normalizedCity = normalizeSearchValue(city);

  if (!canExposePublicMarket(countryCode, "publicTalentDirectory")) {
    return { talents: [], total: 0, totalPages: 1, currentPage: safePage, pageSize: safePageSize };
  }

  const cacheKey = [
    "public-talents-v8",
    countryCode,
    safePage,
    safePageSize,
    normalizedSearch ?? "all",
    normalizedCategory ?? "all",
    normalizedCity ?? "all",
  ].join(":");

  return getCachedValue(cacheKey, async () => {
    const { talents, total } = await getVisiblePublishedCandidates({
      page: safePage,
      pageSize: safePageSize,
      search: normalizedSearch,
      category: normalizedCategory,
      city: normalizedCity,
      countryCode,
    });
    return {
      talents,
      total,
      totalPages: Math.max(1, Math.ceil(total / safePageSize)),
      currentPage: safePage,
      pageSize: safePageSize,
    };
  });
}

export async function getPublishedTalentById(
  id: number,
  countryCode: CountryCode = DEFAULT_PUBLIC_MARKET,
): Promise<Talent | null> {
  if (!canExposePublicMarket(countryCode, "publicTalentDirectory")) return null;

  return getCachedValue(`published-talent:v7:${countryCode}:id:${id}`, async () => {
    const supabase = createAdminClient();
    let query = supabase
      .from("talents")
      .select("*")
      .eq("id", id)
      .eq("published", true);
    query = applyTalentMarketFilter(query, countryCode);
    const { data, error } = await query.maybeSingle();
    if (error) throw new Error(`[getPublishedTalentById] ${error.message}`);
    const candidate = await qualifySingleTalentCandidate(data as Talent | null, countryCode);
    return candidate ? toPublicTalent(candidate) : null;
  });
}

export async function getPublishedTalentBySlug(
  slug: string,
  countryCode: CountryCode = DEFAULT_PUBLIC_MARKET,
): Promise<Talent | null> {
  return getPublishedTalentBySlugForViewer(slug, countryCode);
}

export async function getPublishedTalentBySlugForViewer(
  slug: string,
  countryCode: CountryCode = DEFAULT_PUBLIC_MARKET,
): Promise<Talent | null> {
  const candidate = await getPublishedTalentCandidateBySlug(slug, countryCode);
  if (!candidate) return null;

  const authClient = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) {
    return toPublicTalent(candidate);
  }

  if (candidate.user_id && candidate.user_id === user.id) {
    return toPrivateTalent(candidate);
  }

  const adminClient = createAdminClient();
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("account_type, approval_status, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return toPublicTalent(candidate);
  }

  const canViewPrivateContent = canViewTalentPrivateContent(
    {
      userId: user.id,
      accountType: profile.account_type,
      approvalStatus: profile.approval_status,
      profileStatus: profile.status,
    },
    candidate.user_id,
  );

  return canViewPrivateContent
    ? toPrivateTalent(candidate)
    : toPublicTalent(candidate);
}

export async function getPublishedTalents(
  countryCode: CountryCode = DEFAULT_PUBLIC_MARKET,
): Promise<Talent[]> {
  if (!canExposePublicMarket(countryCode, "publicTalentDirectory")) return [];

  return getCachedValue(`published-talents:v8:${countryCode}:all`, async () => {
    const { talents } = await getVisiblePublishedCandidates({ collectAll: true, countryCode });
    return talents;
  });
}
