import type { Locale } from "@/lib/i18n";
import type { Talent } from "@/lib/types/talent";

export type TalentDisplay = {
  id: number;
  name: string;
  category: string;
  imageUrl: string;
};

export type TalentProfileDisplay = TalentDisplay & {
  city: string | null;
  age: number | null;
  height: string | null;
  bio: string | null;
  whatsapp: string | null;
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

export function toTalentProfileDisplay(
  talent: Talent,
  locale: Locale,
): TalentProfileDisplay {
  const isAr = locale === "ar";
  const city = (isAr ? talent.city_ar : talent.city_en) ?? null;
  const bio = (isAr ? talent.bio_ar : talent.bio_en) ?? null;

  return {
    ...toTalentDisplay(talent, locale),
    city: typeof city === "string" && city.trim() ? city.trim() : null,
    age: talent.age ?? null,
    height:
      typeof talent.height === "string" && talent.height.trim()
        ? talent.height.trim()
        : null,
    bio: typeof bio === "string" && bio.trim() ? bio.trim() : null,
    whatsapp:
      typeof talent.whatsapp === "string" && talent.whatsapp.trim()
        ? talent.whatsapp.trim()
        : null,
  };
}

export function whatsappUrl(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}
