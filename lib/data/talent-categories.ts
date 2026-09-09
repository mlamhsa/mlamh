export const TALENT_CATEGORIES = [
  { slug: "actor", ar: "ممثل / ممثلة", en: "Actor" },
  { slug: "model", ar: "مودل", en: "Model" },
  { slug: "voice_actor", ar: "تعليق صوتي", en: "Voice Over" },
  { slug: "presenter", ar: "مقدم / مقدمة", en: "Presenter / Host" },
  { slug: "content_creator", ar: "صانع محتوى", en: "Content Creator" },
  { slug: "dancer", ar: "راقص / راقصة", en: "Dancer" },
  { slug: "singer", ar: "مغني / مغنية", en: "Singer" },
  { slug: "musician", ar: "موسيقي", en: "Musician" },
  { slug: "extra", ar: "كومبارس", en: "Extra" },
  { slug: "influencer", ar: "مؤثر / مؤثرة", en: "Influencer" },
] as const;

export type TalentCategorySlug =
  (typeof TALENT_CATEGORIES)[number]["slug"];

export function getTalentCategoryBySlug(slug?: string | null) {
  if (!slug) return null;

  return TALENT_CATEGORIES.find((category) => category.slug === slug) ?? null;
}

export function getTalentCategoryLabel(
  slug: string | null | undefined,
  locale: "ar" | "en"
) {
  const category = getTalentCategoryBySlug(slug);

  if (!category) return "";

  return locale === "ar" ? category.ar : category.en;
}