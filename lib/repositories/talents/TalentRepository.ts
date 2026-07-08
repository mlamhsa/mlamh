import { BaseRepository } from "@/lib/repositories/base/BaseRepository";
import type { Talent } from "@/lib/types/talent";

export type AdminTalent = Talent & {
  views: number;
};

type TalentWithViewsRow = Talent & {
  talent_views?: {
    views: number | null;
  } | null;
};

export type TopViewedTalent = {
  id: number;
  slug: string | null;
  name_en: string | null;
  name_ar: string | null;
  image_url: string | null;
  views: number;
};

type TalentSummary = {
  id: number;
  slug: string | null;
  name_en: string | null;
  name_ar: string | null;
  image_url: string | null;
};

type TalentViewRow = {
  views: number | null;
  talents: TalentSummary | TalentSummary[] | null;
};

function normalizeTalentRelation(
  value: TalentSummary | TalentSummary[] | null
): TalentSummary | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export class TalentRepository extends BaseRepository {
  static async getAdminTalents({
    page,
    pageSize,
    status,
    search,
  }: {
    page: number;
    pageSize: number;
    status?: string;
    search?: string;
  }) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const adminClient = this.client();

    let query = adminClient
      .from("talents")
      .select(
        `
        *,
        talent_views (
          views
        )
        `,
        { count: "exact" }
      );

    if (
      status &&
      ["pending", "approved", "rejected"].includes(status)
    ) {
      query = query.eq("status", status);
    }

    if (search?.trim()) {
      const value = search.trim();

      query = query.or(
        `
        name_en.ilike.%${value}%,
        name_ar.ilike.%${value}%,
        category_en.ilike.%${value}%,
        category_ar.ilike.%${value}%,
        city_en.ilike.%${value}%,
        city_ar.ilike.%${value}%
        `
      );
    }

    const { data, error, count } = await query
      .order("id", { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    const rows = (data ?? []) as TalentWithViewsRow[];

    const talents: AdminTalent[] = rows.map((talent) => ({
      ...talent,
      views: talent.talent_views?.views ?? 0,
    }));

    return {
      talents,
      total: count ?? 0,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
      currentPage: page,
      pageSize,
    };
  }
  static async getAdminStats() {
    const total = await this.countByStatus();
  
    const pending = await this.countByStatus("pending");
  
    const approved = await this.countByStatus("approved");
  
    const rejected = await this.countByStatus("rejected");
  
    return {
      total,
      pending,
      approved,
      rejected,
    };
  }
  
  private static async countByStatus(status?: string) {
    const adminClient = this.client();

    let query = adminClient
      .from("talents")
      .select("id", {
        count: "exact",
        head: true,
      });

    if (status) {
      query = query.eq("status", status);
    }

    const { count, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return count ?? 0;
  }

  static async getTopViewed(limit = 5): Promise<TopViewedTalent[]> {
    const { data, error } = await this.client()
      .from("talent_views")
      .select(
        `
        views,
        talents (
          id,
          slug,
          name_en,
          name_ar,
          image_url
        )
        `
      )
      .order("views", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    const rows = (data ?? []) as unknown as TalentViewRow[];

    return rows
      .map((row) => {
        const talent = normalizeTalentRelation(row.talents);

        if (!talent) return null;

        return {
          id: talent.id,
          slug: talent.slug,
          name_en: talent.name_en,
          name_ar: talent.name_ar,
          image_url: talent.image_url,
          views: row.views ?? 0,
        };
      })
      .filter((talent): talent is TopViewedTalent => talent !== null);
  }
}