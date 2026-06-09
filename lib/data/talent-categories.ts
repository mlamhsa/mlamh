export const TALENT_CATEGORIES = [
  { slug: "actor", ar: "ممثل", en: "Actor" },
  { slug: "model", ar: "مودل", en: "Model" },
  { slug: "content_creator", ar: "صانع محتوى", en: "Content Creator" },
  { slug: "presenter", ar: "مقدم برامج", en: "Presenter" },
  { slug: "voice_actor", ar: "معلق صوتي", en: "Voice Actor" },
  { slug: "singer", ar: "مغني", en: "Singer" },
  { slug: "dancer", ar: "راقص", en: "Dancer" },
  { slug: "athlete", ar: "رياضي", en: "Athlete" },
  { slug: "extra", ar: "كومبارس", en: "Extra" },
  { slug: "influencer", ar: "مؤثر", en: "Influencer" },
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