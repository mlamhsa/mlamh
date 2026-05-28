import { createAdminClient } from "@/lib/supabase/admin";
import type { Talent } from "@/lib/types/talent";

type GetAdminTalentsOptions = {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
};

type GetAdminTalentsResult = {
  talents: Talent[];
  total: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
};

export async function getAdminTalents({
  page = 1,
  pageSize = 12,
  status,
  search,
}: GetAdminTalentsOptions = {}): Promise<GetAdminTalentsResult> {
  const supabase = createAdminClient();

  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(pageSize, 1), 50);

  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  let query = supabase
    .from("talents")
    .select("*", { count: "exact" });

  if (
    status &&
    ["pending", "approved", "rejected"].includes(status)
  ) {
    query = query.eq("status", status);
  }

  if (search?.trim()) {
    const value = search.trim();

    query = query.or(`
      name_en.ilike.%${value}%,
      name_ar.ilike.%${value}%,
      category_en.ilike.%${value}%,
      category_ar.ilike.%${value}%,
      city_en.ilike.%${value}%,
      city_ar.ilike.%${value}%
    `);
  }

  const { data, error, count } = await query
    .order("id", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`[getAdminTalents] ${error.message}`);
  }

  const total = count ?? 0;

  return {
    talents: (data ?? []) as Talent[],
    total,
    totalPages: Math.max(1, Math.ceil(total / safePageSize)),
    currentPage: safePage,
    pageSize: safePageSize,
  };
}