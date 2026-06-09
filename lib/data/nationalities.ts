export const NATIONALITIES = [
  { slug: "saudi", ar: "سعودي", en: "Saudi" },
  { slug: "emirati", ar: "إماراتي", en: "Emirati" },
  { slug: "kuwaiti", ar: "كويتي", en: "Kuwaiti" },
  { slug: "qatari", ar: "قطري", en: "Qatari" },
  { slug: "bahraini", ar: "بحريني", en: "Bahraini" },
  { slug: "omani", ar: "عُماني", en: "Omani" },
  { slug: "egyptian", ar: "مصري", en: "Egyptian" },
  { slug: "jordanian", ar: "أردني", en: "Jordanian" },
  { slug: "lebanese", ar: "لبناني", en: "Lebanese" },
  { slug: "syrian", ar: "سوري", en: "Syrian" },
  { slug: "iraqi", ar: "عراقي", en: "Iraqi" },
  { slug: "palestinian", ar: "فلسطيني", en: "Palestinian" },
  { slug: "yemeni", ar: "يمني", en: "Yemeni" },
  { slug: "sudanese", ar: "سوداني", en: "Sudanese" },
  { slug: "moroccan", ar: "مغربي", en: "Moroccan" },
  { slug: "algerian", ar: "جزائري", en: "Algerian" },
  { slug: "tunisian", ar: "تونسي", en: "Tunisian" },
  { slug: "libyan", ar: "ليبي", en: "Libyan" },
  { slug: "american", ar: "أمريكي", en: "American" },
  { slug: "british", ar: "بريطاني", en: "British" },
  { slug: "canadian", ar: "كندي", en: "Canadian" },
  { slug: "french", ar: "فرنسي", en: "French" },
  { slug: "german", ar: "ألماني", en: "German" },
  { slug: "turkish", ar: "تركي", en: "Turkish" },
  { slug: "pakistani", ar: "باكستاني", en: "Pakistani" },
  { slug: "indian", ar: "هندي", en: "Indian" },
  { slug: "bangladeshi", ar: "بنغلاديشي", en: "Bangladeshi" },
  { slug: "filipino", ar: "فلبيني", en: "Filipino" },
] as const;

export function getNationalityBySlug(slug?: string | null) {
  if (!slug) return null;

  return (
    NATIONALITIES.find(
      (nationality) => nationality.slug === slug
    ) ?? null
  );
}