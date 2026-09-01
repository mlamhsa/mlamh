import { getCachedValue } from "@/lib/cache/public-talents";
import { createAdminClient } from "@/lib/supabase/admin";
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
  const values = [
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
  ];
  return values.some((value) => includesTerm(value, [term]));
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

async function attachProfileApprovalContext(
  talents: Talent[],
): Promise<PublicTalentCandidate[]> {
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

export function passesPublicTalentVisibilityPolicy(
  talent: TalentQualificationInput,
) {
  return isTalentPubliclyVisible(talent);
}

const PUBLIC_DIRECTORY_BATCH_SIZE = 100;

type VisiblePublishedCandidateOptions = {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  city?: string;
  collectAll?: boolean;
};

async function getVisiblePublishedCandidates({
  page = 1,
  pageSize = 12,
  search,
  category,
  city,
  collectAll = false,
}: VisiblePublishedCandidateOptions = {}): Promise<{
  talents: PublicTalentCandidate[];
  total: number;
}> {
  const supabase = createAdminClient();
  const targetFrom = (page - 1) * pageSize;
  const targetTo = targetFrom + pageSize;
  const talents: PublicTalentCandidate[] = [];
  let total = 0;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("talents")
      .select("*")
      .eq("published", true)
      .in("status", ["approved", "active"])
      .or("primary_role.in.(actor,model),category_slug.in.(actor,model)")
      .order("featured", { ascending: false, nullsFirst: false })
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("id", { ascending: false })
      .range(offset, offset + PUBLIC_DIRECTORY_BATCH_SIZE - 1);

    if (error) throw new Error(`[public-talents:candidates] ${error.message}`);
    const rows = (data ?? []) as Talent[];
    const candidates = await attachProfileApprovalContext(rows);

    for (const candidate of candidates) {
      if (
        !passesPublicTalentVisibilityPolicy(candidate) ||
        !matchesSearch(candidate, search) ||
        !matchesCategory(candidate, category) ||
        !matchesCity(candidate, city)
      ) {
        continue;
      }

      if (collectAll || (total >= targetFrom && total < targetTo)) {
        talents.push(candidate);
      }
      total += 1;
    }

    if (rows.length < PUBLIC_DIRECTORY_BATCH_SIZE) break;
    offset += PUBLIC_DIRECTORY_BATCH_SIZE;
  }

  // Derived qualification includes URL validation and profile approval from a
  // separate table, so an exact directory total cannot be a single DB count
  // without a view/RPC (out of scope while migrations are prohibited). We scan
  // bounded DB pages and retain only the requested page, avoiding fetch-all and
  // full-table memory growth while preserving gallery-image fallback.
  return { talents, total };
}

async function qualifySingleTalent(talent: Talent | null): Promise<Talent | null> {
  if (!talent) return null;
  const [candidate] = await attachProfileApprovalContext([talent]);
  return candidate && passesPublicTalentVisibilityPolicy(candidate) ? candidate : null;
}

export async function getPublicTalents({
  page = 1,
  pageSize = 12,
  search,
  category,
  city,
}: GetPublicTalentsOptions = {}): Promise<GetPublicTalentsResult> {
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(pageSize, 1), 48);
  const normalizedSearch = normalizeSearchValue(search);
  const normalizedCategory = normalizeSearchValue(category);
  const normalizedCity = normalizeSearchValue(city);

  const cacheKey = [
    "public-talents-v5",
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

export async function getPublishedTalentById(id: number): Promise<Talent | null> {
  return getCachedValue(`published-talent:v4:id:${id}`, async () => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("talents")
      .select("*")
      .eq("id", id)
      .eq("published", true)
      .maybeSingle();

    if (error) throw new Error(`[getPublishedTalentById] ${error.message}`);
    return qualifySingleTalent(data as Talent | null);
  });
}

export async function getPublishedTalentBySlug(slug: string): Promise<Talent | null> {
  const normalizedSlug = normalizeSlug(slug);
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("talents")
    .select("*")
    .eq("slug", normalizedSlug)
    .eq("published", true)
    .maybeSingle();

  if (error) throw new Error(`[getPublishedTalentBySlug] ${error.message}`);
  return qualifySingleTalent(data as Talent | null);
}

export async function getPublishedTalents(): Promise<Talent[]> {
  return getCachedValue("published-talents:v5:all", async () => {
    const { talents } = await getVisiblePublishedCandidates({ collectAll: true });
    return talents;
  });
}
