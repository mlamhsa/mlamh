export const SAUDI_CITIES = [
  { slug: "riyadh", ar: "الرياض", en: "Riyadh" },
  { slug: "jeddah", ar: "جدة", en: "Jeddah" },
  { slug: "makkah", ar: "مكة", en: "Makkah" },
  { slug: "madinah", ar: "المدينة المنورة", en: "Madinah" },
  { slug: "dammam", ar: "الدمام", en: "Dammam" },
  { slug: "khobar", ar: "الخبر", en: "Khobar" },
  { slug: "dhahran", ar: "الظهران", en: "Dhahran" },
  { slug: "taif", ar: "الطائف", en: "Taif" },
  { slug: "tabuk", ar: "تبوك", en: "Tabuk" },
  { slug: "abha", ar: "أبها", en: "Abha" },
  { slug: "khamis-mushait", ar: "خميس مشيط", en: "Khamis Mushait" },
  { slug: "hail", ar: "حائل", en: "Hail" },
  { slug: "buraydah", ar: "بريدة", en: "Buraydah" },
  { slug: "unayzah", ar: "عنيزة", en: "Unayzah" },
  { slug: "jubail", ar: "الجبيل", en: "Jubail" },
  { slug: "yanbu", ar: "ينبع", en: "Yanbu" },
  { slug: "najran", ar: "نجران", en: "Najran" },
  { slug: "jazan", ar: "جازان", en: "Jazan" },
  { slug: "arar", ar: "عرعر", en: "Arar" },
  { slug: "sakaka", ar: "سكاكا", en: "Sakaka" },
  { slug: "al-baha", ar: "الباحة", en: "Al Baha" },
] as const;

export type SaudiCitySlug = (typeof SAUDI_CITIES)[number]["slug"];

export function getSaudiCityBySlug(slug?: string | null) {
  if (!slug) return null;
  return SAUDI_CITIES.find((city) => city.slug === slug) ?? null;
}

export function getSaudiCityLabel(
  slug: string | null | undefined,
  locale: "ar" | "en"
) {
  const city = getSaudiCityBySlug(slug);
  if (!city) return "";
  return locale === "ar" ? city.ar : city.en;
}