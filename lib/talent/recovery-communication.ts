export type TalentCommunicationLocale = "ar" | "en" | "bilingual";

export type LocalizedRecoveryItem = {
  ar: string;
  en: string;
};

export type RecoveryItemInput = LocalizedRecoveryItem | string;

const KNOWN_RECOVERY_ITEMS: LocalizedRecoveryItem[] = [
  { ar: "الاسم", en: "Name" },
  { ar: "رقم الجوال", en: "Phone number" },
  { ar: "الصورة الشخصية", en: "Profile photo" },
  { ar: "نوع الموهبة", en: "Talent type" },
  { ar: "بلد الإقامة", en: "Country of residence" },
  { ar: "المدينة", en: "City" },
  { ar: "الجنس", en: "Gender" },
  { ar: "الجنسية", en: "Nationality" },
  { ar: "تاريخ الميلاد", en: "Date of birth" },
  { ar: "طريقة ظهور الملف", en: "Profile visibility" },
  {
    ar: "الموافقة على دقة البيانات والتواصل",
    en: "Data accuracy and contact consent",
  },
  { ar: "النبذة التعريفية", en: "Profile bio" },
  { ar: "الطول", en: "Height" },
];

export function resolveTalentCommunicationLocale(
  userMetadata: Record<string, unknown> | null | undefined,
): TalentCommunicationLocale {
  const preferredLocale = String(
    userMetadata?.preferred_locale ?? "",
  )
    .trim()
    .toLowerCase();

  if (preferredLocale === "ar" || preferredLocale.startsWith("ar-")) {
    return "ar";
  }

  if (preferredLocale === "en" || preferredLocale.startsWith("en-")) {
    return "en";
  }

  // Legacy accounts may predate preferred_locale. Do not guess a communication
  // language from nationality, spoken languages, profile content, or the admin
  // UI language. A bilingual reminder is safer until the user explicitly
  // establishes a preference.
  return "bilingual";
}

function normalizeRecoveryItem(item: RecoveryItemInput): LocalizedRecoveryItem {
  if (typeof item !== "string") return item;

  const value = item.trim();
  const known = KNOWN_RECOVERY_ITEMS.find(
    (candidate) => candidate.ar === value || candidate.en === value,
  );

  return known ?? { ar: value, en: value };
}

export function formatRecoveryItems(
  items: RecoveryItemInput[],
  locale: TalentCommunicationLocale,
): string[] {
  return items.map((rawItem) => {
    const item = normalizeRecoveryItem(rawItem);
    if (locale === "ar") return item.ar;
    if (locale === "en") return item.en;
    if (item.ar === item.en) return item.en;
    return `${item.en} — ${item.ar}`;
  });
}
