// public-talents.ts (نسخة معدلة مع الحقول الجديدة)
// النسخة الأصلية احتفظ بها باسم public-talents.original.ts

import { getCachedValue } from "@/lib/cache/public-talents";
import { createAdminClient } from "@/lib/supabase/admin";
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

const CATEGORY_ALIASES: Record<string, string[]> = {
  actor: ["actor", "actors", "acting", "ممثل", "ممثلون", "تمثيل"],
  model: ["model", "models", "modeling", "مودل", "مودلز", "عارض", "عارضة"],
  content_creator: [
    "content_creator",
    "creator",
    "creators",
    "content creator",
    "content creators",
    "صانع محتوى",
    "صناع محتوى",
    "محتوى",
  ],
  presenter: [
    "presenter",
    "presenters",
    "host",
    "hosts",
    "tv host",
    "مقدم",
    "مقدمة",
    "مقدمو برامج",
    "تقديم",
    "إعلام",
  ],
  voice_actor: [
    "voice_actor",
    "voice",
    "voice over",
    "voiceover",
    "voice artist",
    "voice artists",
    "تعليق صوتي",
    "معلق صوتي",
    "معلقون صوتيون",
  ],
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

  if (!normalizedCategory) {
    return [];
  }

  const normalizedKey = normalizedCategory.toLowerCase();
  return CATEGORY_ALIASES[normalizedKey] ?? [normalizedCategory];
}

function buildIlikeOrFilter(columns: string[], terms: string[]) {
  return terms
    .flatMap((term) =>
      columns.map(
        (column) => `${column}.ilike.%${term.replace(/[%]/g, "")}%`
      )
    )
    .join(",");
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
  const categoryTerms = getCategorySearchTerms(normalizedCategory);

  const cacheKey = [
    "public-talents-v2",
    safePage,
    safePageSize,
    normalizedSearch ?? "all",
    normalizedCategory ?? "all",
    normalizedCity ?? "all",
  ].join(":");

  return getCachedValue(cacheKey, async () => {
    const supabase = createAdminClient();
    const from = (safePage - 1) * safePageSize;
    const to = from + safePageSize - 1;

    let query = supabase
      .from("talents")
      .select("*", { count: "exact" })
      .eq("published", true)
      .eq("status", "approved");

    if (normalizedSearch) {
      query = query.or(
        buildIlikeOrFilter(
          [
            "name_en",
            "name_ar",
            "display_name_en",
            "display_name_ar",
            "category_slug",
            "category_en",
            "category_ar",
            "city_slug",
            "city_en",
            "city_ar",
          ],
          [normalizedSearch]
        )
      );
    }

    if (normalizedCategory && categoryTerms.length > 0) {
      query = query.or(
        [
          `category_slug.eq.${normalizedCategory}`,
          buildIlikeOrFilter(["category_en", "category_ar"], categoryTerms),
        ]
          .filter(Boolean)
          .join(",")
      );
    }

    if (normalizedCity) {
      query = query.or(
        [
          `city_slug.eq.${normalizedCity}`,
          buildIlikeOrFilter(["city_en", "city_ar"], [normalizedCity]),
        ]
          .filter(Boolean)
          .join(",")
      );
    }

    const { data, error, count } = await query
      .order("featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("id", { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`[getPublicTalents] ${error.message}`);
    }

    const total = count ?? 0;

    return {
      talents: (data ?? []) as Talent[],
      total,
      totalPages: Math.max(1, Math.ceil(total / safePageSize)),
      currentPage: safePage,
      pageSize: safePageSize,
    };
  });
}

export async function getPublishedTalentById(
  id: number
): Promise<Talent | null> {
  return getCachedValue(`published-talent:v2:id:${id}`, async () => {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("talents")
      .select("*")
      .eq("id", id)
      .eq("published", true)
      .eq("status", "approved")
      .maybeSingle();

    if (error) {
      throw new Error(`[getPublishedTalentById] ${error.message}`);
    }

    return data as Talent | null;
  });
}

export async function getPublishedTalentBySlug(
  slug: string
): Promise<Talent | null> {
  const normalizedSlug = normalizeSlug(slug);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("talents")
    .select("*")
    .eq("slug", normalizedSlug)
    .eq("published", true)
    .eq("status", "approved")
    .maybeSingle();

  if (error) {
    throw new Error(`[getPublishedTalentBySlug] ${error.message}`);
  }

  console.log("[getPublishedTalentBySlug]", {
    receivedSlug: slug,
    normalizedSlug,
    found: Boolean(data),
    databaseSlug: data?.slug ?? null,
    published: data?.published ?? null,
    status: data?.status ?? null,
  });

  return data as Talent | null;
}

export async function getPublishedTalents(): Promise<Talent[]> {
  return getCachedValue("published-talents:v2:all", async () => {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("talents")
      .select("*")
      .eq("published", true)
      .eq("status", "approved")
      .order("featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("id", { ascending: false });

    if (error) {
      throw new Error(`[getPublishedTalents] ${error.message}`);
    }

    return (data ?? []) as Talent[];
  });
}
