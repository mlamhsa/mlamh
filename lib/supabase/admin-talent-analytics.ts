import { createAdminClient } from "@/lib/supabase/admin";

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
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

export async function getTopViewedTalents(
  limit = 5
): Promise<TopViewedTalent[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
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
    throw new Error(`[getTopViewedTalents] ${error.message}`);
  }

  const rows = (data ?? []) as unknown as TalentViewRow[];

  return rows
    .map((row) => {
      const talent = normalizeTalentRelation(row.talents);

      if (!talent) {
        return null;
      }

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