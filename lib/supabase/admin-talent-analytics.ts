import { createAdminClient } from "@/lib/supabase/admin";

export type TopViewedTalent = {
  id: number;
  slug: string | null;
  name_en: string | null;
  name_ar: string | null;
  image_url: string | null;
  views: number;
};

type TalentViewRow = {
  views: number | null;
  talents: {
    id: number;
    slug: string | null;
    name_en: string | null;
    name_ar: string | null;
    image_url: string | null;
  } | null;
};

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

  const rows = (data ?? []) as TalentViewRow[];

  return rows
    .filter((row) => row.talents)
    .map((row) => ({
      id: row.talents!.id,
      slug: row.talents!.slug,
      name_en: row.talents!.name_en,
      name_ar: row.talents!.name_ar,
      image_url: row.talents!.image_url,
      views: row.views ?? 0,
    }));
}