import { cache } from "react";

import { getCachedValue } from "@/lib/cache/public-talents";
import { findNationality } from "@/lib/data/nationalities";
import type { CountryCode } from "@/lib/markets/countries";
import {
  canExposePublicMarket,
  canExposePublicTalent,
} from "@/lib/markets/public-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  canViewTalentPrivateContent,
  canViewTalentProfile,
  grantTalentPrivateContent,
  hideTalentPrivateContent,
} from "@/lib/talent/public-profile-access";
import {
  evaluateTalentQualification,
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
  gender?: string;
  nationality?: string;
  ageMin?: number | null;
  ageMax?: number | null;
  heightMin?: number | null;
  heightMax?: number | null;
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

function matchesGender(talent: Talent, gender?: string) {
  if (!gender) return true;
  return String(talent.gender ?? "").trim().toLowerCase() === gender.toLowerCase();
}

function matchesNationality(talent: Talent, nationality?: string) {
  const requested = nationality?.trim();
  if (!requested) return true;
  const target = findNationality(requested);
  const candidate = findNationality(talent.nationality_slug) ?? findNationality(talent.nationality);
  if (target && candidate) return target.slug === candidate.slug;
  const normalizedRequested = requested.toLowerCase();
  return [talent.nationality_slug, talent.nationality]
    .some((value) => String(value ?? "").trim().toLowerCase() === normalizedRequested);
}

function ageFromDob(dateOfBirth?: string | null) {
  if (!dateOfBirth) return null;
  const birth = new Date(dateOfBirth);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const monthDelta = now.getUTCMonth() - birth.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getUTCDate() < birth.getUTCDate())) age -= 1;
  return age >= 0 ? age : null;
}

function matchesAdvancedFilters(talent: Talent, options: GetPublicTalentsOptions) {
  if (!matchesGender(talent, options.gender)) return false;
  if (!matchesNationality(talent, options.nationality)) return false;

  const age = ageFromDob(talent.date_of_birth);
  if (options.ageMin != null && (age == null || age < options.ageMin)) return false;
  if (options.ageMax != null && (age == null || age > options.ageMax)) return false;

  const height = typeof talent.height_cm === "number" ? talent.height_cm : Number(talent.height_cm);
  if (options.heightMin != null && (!Number.isFinite(height) || height < options.heightMin)) return false;
  if (options.heightMax != null && (!Number.isFinite(height) || height > options.heightMax)) return false;
  return true;
}

function formatDateUtc(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function birthdayCutoff(yearsAgo: number, addDay = false) {
  const now = new Date();
  const date = new Date(Date.UTC(now.getUTCFullYear() - yearsAgo, now.getUTCMonth(), now.getUTCDate()));
  if (addDay) date.setUTCDate(date.getUTCDate() + 1);
  return formatDateUtc(date);
}

function applyTalentMarketFilter<T extends { or: Function; eq: Function }>(
  query: T,
  countryCode: CountryCode,
): T {
  return (countryCode === "SA"
    ? query.or("base_country_code.eq.SA,base_country_code.is.null")
    : query.eq("base_country_code", countryCode)) as T;
}

function applyAdvancedDbFilters<T extends { eq: Function; gte: Function; lte: Function; or: Function }>(
  query: T,
  options: GetPublicTalentsOptions,
): T {
  let next = query;
  if (options.gender) next = next.eq("gender", options.gender) as T;
  if (options.heightMin != null) next = next.gte("height_cm", options.heightMin) as T;
  if (options.heightMax != null) next = next.lte("height_cm", options.heightMax) as T;
  if (options.ageMin != null) next = next.lte("date_of_birth", birthdayCutoff(options.ageMin)) as T;
  if (options.ageMax != null) next = next.gte("date_of_birth", birthdayCutoff(options.ageMax + 1, true)) as T;

  const nationality = findNationality(options.nationality);
  if (nationality) {
    next = next.or(
      `nationality_slug.eq.${nationality.slug},nationality.eq.${nationality.slug},nationality.eq.${nationality.en},nationality.eq.${nationality.ar}`,
    ) as T;
  }
  return next;
}

function toPublicTalent(candidate: PublicTalentCandidate): Talent {
  const { profile_approval_status: _approval, profile_status: _status, primary_role: _role, ...talent } = candidate;
  return hideTalentPrivateContent(talent as Talent);
}

function toPrivateTalent(candidate: PublicTalentCandidate): Talent {
  const { profile_approval_status: _approval, profile_status: _status, primary_role: _role, ...talent } = candidate;
  return grantTalentPrivateContent(talent as Talent);
}

async function attachProfileApprovalContext(talents: Talent[]): Promise<PublicTalentCandidate[]> {
  if (talents.length === 0) return [];
  const supabase = createAdminClient();
  const userIds = talents.map((talent) => talent.user_id?.trim()).filter((value): value is string => Boolean(value));
  const profileByUserId = new Map<string, { approval_status: string | null; status: string | null }>();
  if (userIds.length > 0) {
    const { data: profiles, error } = await supabase.from("profiles").select("user_id, approval_status, status").in("user_id", userIds);
    if (error) throw new Error(`[public-talents:profiles] ${error.message}`);
    for (const profile of profiles ?? []) profileByUserId.set(profile.user_id, { approval_status: profile.approval_status, status: profile.status });
  }
  return talents.map((talent) => {
    const profile = talent.user_id ? profileByUserId.get(talent.user_id) : undefined;
    return { ...talent, profile_approval_status: profile?.approval_status, profile_status: profile?.status };
  });
}

export function passesPublicTalentVisibilityPolicy(talent: TalentQualificationInput) {
  return isTalentPubliclyVisible(talent);
}

type VisiblePublishedCandidateOptions = GetPublicTalentsOptions & { collectAll?: boolean };

async function getVisiblePublishedCandidates(options: VisiblePublishedCandidateOptions = {}): Promise<{ talents: Talent[]; total: number }> {
  const {
    page = 1,
    pageSize = 12,
    search,
    category,
    city,
    countryCode = DEFAULT_PUBLIC_MARKET,
    collectAll = false,
  } = options;
  if (!canExposePublicMarket(countryCode, "publicTalentDirectory")) return { talents: [], total: 0 };
  const supabase = createAdminClient();
  const targetFrom = (page - 1) * pageSize;
  const targetTo = targetFrom + pageSize;
  const talents: Talent[] = [];
  let total = 0;
  let offset = 0;
  while (true) {
    let query = supabase.from("talents").select("*").eq("published", true).in("status", ["approved", "active"]).or("primary_role.in.(actor,model),category_slug.in.(actor,model)");
    query = applyTalentMarketFilter(query, countryCode);
    query = applyAdvancedDbFilters(query, options);
    const { data, error } = await query.order("featured", { ascending: false, nullsFirst: false }).order("sort_order", { ascending: true, nullsFirst: false }).order("id", { ascending: false }).range(offset, offset + PUBLIC_DIRECTORY_BATCH_SIZE - 1);
    if (error) throw new Error(`[public-talents:candidates] ${error.message}`);
    const rows = (data ?? []) as Talent[];
    const candidates = await attachProfileApprovalContext(rows);
    for (const candidate of candidates) {
      if (
        !canExposePublicTalent(candidate, countryCode) ||
        !passesPublicTalentVisibilityPolicy(candidate) ||
        !matchesSearch(candidate, search) ||
        !matchesCategory(candidate, category) ||
        !matchesCity(candidate, city) ||
        !matchesAdvancedFilters(candidate, options)
      ) continue;
      if (collectAll || (total >= targetFrom && total < targetTo)) talents.push(toPublicTalent(candidate));
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
  requirePublicVisibility = true,
): Promise<PublicTalentCandidate | null> {
  if (!talent || !canExposePublicTalent(talent, countryCode)) return null;
  const [candidate] = await attachProfileApprovalContext([talent]);
  if (!candidate) return null;
  if (requirePublicVisibility) return passesPublicTalentVisibilityPolicy(candidate) ? candidate : null;
  return evaluateTalentQualification(candidate).qualified ? candidate : null;
}

async function getPublishedTalentCandidateBySlug(slug: string, countryCode: CountryCode = DEFAULT_PUBLIC_MARKET): Promise<PublicTalentCandidate | null> {
  if (!canExposePublicMarket(countryCode, "publicTalentDirectory")) return null;
  const normalizedSlug = normalizeSlug(slug);
  const supabase = createAdminClient();
  let query = supabase.from("talents").select("*").eq("slug", normalizedSlug).eq("published", true);
  query = applyTalentMarketFilter(query, countryCode);
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(`[getPublishedTalentBySlug] ${error.message}`);
  return qualifySingleTalentCandidate(data as Talent | null, countryCode, false);
}

export async function getPublicTalents(options: GetPublicTalentsOptions = {}): Promise<GetPublicTalentsResult> {
  const {
    page = 1,
    pageSize = 12,
    search,
    category,
    city,
    countryCode = DEFAULT_PUBLIC_MARKET,
    gender,
    nationality,
    ageMin,
    ageMax,
    heightMin,
    heightMax,
  } = options;
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(pageSize, 1), 48);
  const normalizedSearch = normalizeSearchValue(search);
  const normalizedCategory = normalizeSearchValue(category);
  const normalizedCity = normalizeSearchValue(city);
  const normalizedGender = normalizeSearchValue(gender)?.toLowerCase();
  const normalizedNationality = normalizeSearchValue(nationality);
  if (!canExposePublicMarket(countryCode, "publicTalentDirectory")) return { talents: [], total: 0, totalPages: 1, currentPage: safePage, pageSize: safePageSize };
  const cacheKey = [
    "public-talents-v9",
    countryCode,
    safePage,
    safePageSize,
    normalizedSearch ?? "all",
    normalizedCategory ?? "all",
    normalizedCity ?? "all",
    normalizedGender ?? "all",
    normalizedNationality ?? "all",
    ageMin ?? "all",
    ageMax ?? "all",
    heightMin ?? "all",
    heightMax ?? "all",
  ].join(":");
  return getCachedValue(cacheKey, async () => {
    const { talents, total } = await getVisiblePublishedCandidates({
      page: safePage,
      pageSize: safePageSize,
      search: normalizedSearch,
      category: normalizedCategory,
      city: normalizedCity,
      countryCode,
      gender: normalizedGender,
      nationality: normalizedNationality,
      ageMin,
      ageMax,
      heightMin,
      heightMax,
    });
    return { talents, total, totalPages: Math.max(1, Math.ceil(total / safePageSize)), currentPage: safePage, pageSize: safePageSize };
  });
}

export async function getPublishedTalentById(id: number, countryCode: CountryCode = DEFAULT_PUBLIC_MARKET): Promise<Talent | null> {
  if (!canExposePublicMarket(countryCode, "publicTalentDirectory")) return null;
  return getCachedValue(`published-talent:v7:${countryCode}:id:${id}`, async () => {
    const supabase = createAdminClient();
    let query = supabase.from("talents").select("*").eq("id", id).eq("published", true);
    query = applyTalentMarketFilter(query, countryCode);
    const { data, error } = await query.maybeSingle();
    if (error) throw new Error(`[getPublishedTalentById] ${error.message}`);
    const candidate = await qualifySingleTalentCandidate(data as Talent | null, countryCode, true);
    return candidate ? toPublicTalent(candidate) : null;
  });
}

export async function getPublishedTalentBySlug(slug: string, countryCode: CountryCode = DEFAULT_PUBLIC_MARKET): Promise<Talent | null> {
  return getPublishedTalentBySlugForViewer(slug, countryCode);
}

export async function getPublishedTalentBySlugForViewer(slug: string, countryCode: CountryCode = DEFAULT_PUBLIC_MARKET): Promise<Talent | null> {
  const candidate = await getPublishedTalentCandidateBySlug(slug, countryCode);
  if (!candidate) return null;

  const anonymousViewer = { userId: null, accountType: null };
  const authClient = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) return canViewTalentProfile(anonymousViewer, candidate) ? toPublicTalent(candidate) : null;
  if (candidate.user_id && candidate.user_id === user.id) return toPrivateTalent(candidate);

  const adminClient = createAdminClient();
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, account_type, approval_status, status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileError || !profile) return canViewTalentProfile(anonymousViewer, candidate) ? toPublicTalent(candidate) : null;

  let publisherVerified: boolean | null = null;
  let publisherVerificationStatus: string | null = null;
  let publisherStatus: string | null = null;
  if (profile.account_type === "publisher") {
    const { data: publisher } = await adminClient
      .from("publishers")
      .select("verified, verification_status, status")
      .eq("profile_id", profile.id)
      .maybeSingle();
    publisherVerified = publisher?.verified ?? null;
    publisherVerificationStatus = publisher?.verification_status ?? null;
    publisherStatus = publisher?.status ?? null;
  }

  const viewer = {
    userId: user.id,
    accountType: profile.account_type,
    approvalStatus: profile.approval_status,
    profileStatus: profile.status,
    publisherVerified,
    publisherVerificationStatus,
    publisherStatus,
  };

  if (!canViewTalentProfile(viewer, candidate)) return null;
  return canViewTalentPrivateContent(viewer, candidate.user_id) ? toPrivateTalent(candidate) : toPublicTalent(candidate);
}

export async function getPublishedTalents(countryCode: CountryCode = DEFAULT_PUBLIC_MARKET): Promise<Talent[]> {
  if (!canExposePublicMarket(countryCode, "publicTalentDirectory")) return [];
  return getCachedValue(`published-talents:v8:${countryCode}:all`, async () => {
    const { talents } = await getVisiblePublishedCandidates({ collectAll: true, countryCode });
    return talents;
  });
}
