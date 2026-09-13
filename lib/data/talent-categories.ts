export const TALENT_CATEGORIES = [
  { slug: "actor", ar: "ممثل / ممثلة", en: "Actor" },
  { slug: "model", ar: "مودل", en: "Model" },
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
