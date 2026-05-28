import { getCachedValue } from "@/lib/cache/public-talents";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Talent } from "@/lib/types/talent";

type GetPublicTalentsOptions = {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
};

type GetPublicTalentsResult = {
  talents: Talent[];
  total: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
};

function normalizeSearchValue(value?: string) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
}

export async function getPublicTalents({
  page = 1,
  pageSize = 12,
  search,
  category,
}: GetPublicTalentsOptions = {}): Promise<GetPublicTalentsResult> {
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(pageSize, 1), 48);

  const normalizedSearch = normalizeSearchValue(search);
  const normalizedCategory = normalizeSearchValue(category);

  const cacheKey = [
    "public-talents",
    safePage,
    safePageSize,
    normalizedSearch ?? "all",
    normalizedCategory ?? "all",
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
        [
          `name_en.ilike.%${normalizedSearch}%`,
          `name_ar.ilike.%${normalizedSearch}%`,
          `category_en.ilike.%${normalizedSearch}%`,
          `category_ar.ilike.%${normalizedSearch}%`,
          `city_en.ilike.%${normalizedSearch}%`,
          `city_ar.ilike.%${normalizedSearch}%`,
        ].join(",")
      );
    }

    if (normalizedCategory) {
      query = query.or(
        [
          `category_en.ilike.%${normalizedCategory}%`,
          `category_ar.ilike.%${normalizedCategory}%`,
        ].join(",")
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

export async function getPublishedTalents(): Promise<Talent[]> {
  return getCachedValue("published-talents:all", async () => {
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

export async function getPublishedTalentById(
  id: number
): Promise<Talent | null> {
  return getCachedValue(`published-talent:id:${id}`, async () => {
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
  const normalizedSlug = slug.trim().toLowerCase();

  return getCachedValue(
    `published-talent:slug:${normalizedSlug}`,
    async () => {
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

      return data as Talent | null;
    }
  );
}