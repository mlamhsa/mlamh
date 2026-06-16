import { getTalents } from "@/lib/supabase/talents";

export async function getTalentData() {
  const talents = await getTalents();

  return talents.map((t) => ({
    id: t.id,
    name: t.name_en || t.name_ar,
    image: t.image_url,
    city: t.city_en || t.city_ar,
    category: t.category_en || t.category_ar,
    featured: t.featured,
  }));
}