import type { Locale } from "@/lib/i18n";
import { getSaudiCityLabel } from "@/lib/data/saudi-cities";
import { getTalentCategoryLabel } from "@/lib/data/talent-categories";
import type { Talent } from "@/lib/types/talent";

export function getTalentName(talent: Talent, locale: Locale) {
  if (locale === "ar") {
    return (
      talent.display_name_ar ||
      talent.display_name_en ||
      talent.name_ar ||
      talent.name_en
    );
  }

  return (
    talent.display_name_en ||
    talent.display_name_ar ||
    talent.name_en ||
    talent.name_ar
  );
}

export function getTalentCategory(talent: Talent, locale: Locale) {
  const labelFromSlug = getTalentCategoryLabel(talent.category_slug, locale);

  if (labelFromSlug) return labelFromSlug;

  return locale === "ar"
    ? talent.category_ar || talent.category_en
    : talent.category_en || talent.category_ar;
}

export function getTalentCity(talent: Talent, locale: Locale) {
  const labelFromSlug = getSaudiCityLabel(talent.city_slug, locale);

  if (labelFromSlug) return labelFromSlug;

  return locale === "ar"
    ? talent.city_ar || talent.city_en
    : talent.city_en || talent.city_ar;
}

export function getTalentBio(talent: Talent, locale: Locale) {
  return locale === "ar"
    ? talent.bio_ar || talent.bio_en
    : talent.bio_en || talent.bio_ar;
}