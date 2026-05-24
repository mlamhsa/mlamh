import type { Locale } from "@/lib/i18n";
import type { Talent } from "@/lib/types/talent";

export type TalentDisplay = {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
};

export function toTalentDisplay(talent: Talent, locale: Locale): TalentDisplay {
  const isAr = locale === "ar";
  return {
    id: talent.id,
    name: isAr ? talent.name_ar : talent.name_en,
    category: isAr ? talent.category_ar : talent.category_en,
    imageUrl: talent.image_url,
  };
}
