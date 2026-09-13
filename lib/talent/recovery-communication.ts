export type TalentCommunicationLocale = "ar" | "en" | "bilingual";

export type LocalizedRecoveryItem = {
  ar: string;
  en: string;
};

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

export function formatRecoveryItems(
  items: LocalizedRecoveryItem[],
  locale: TalentCommunicationLocale,
): string[] {
  return items.map((item) => {
    if (locale === "ar") return item.ar;
    if (locale === "en") return item.en;
    return `${item.en} — ${item.ar}`;
  });
}
