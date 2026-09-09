import type { AppLocale } from "@/lib/i18n";

const VALUES: Record<string, { ar: string; en: string }> = {
  sa: { ar: "السعودية", en: "Saudi Arabia" },
  ae: { ar: "الإمارات", en: "UAE" },
  qa: { ar: "قطر", en: "Qatar" },
  saudi: { ar: "سعودي", en: "Saudi" },
  egyptian: { ar: "مصري", en: "Egyptian" },
  moroccan: { ar: "مغربي", en: "Moroccan" },
  northern: { ar: "شمالي", en: "Northern" },
  central: { ar: "وسطي", en: "Central" },
  southern: { ar: "جنوبي", en: "Southern" },
  western: { ar: "غربي", en: "Western" },
  eastern: { ar: "شرقي", en: "Eastern" },
  available_now: { ar: "متاح الآن", en: "Available now" },
  unavailable: { ar: "غير متاح", en: "Unavailable" },
  acting: { ar: "تمثيل", en: "Acting" },
  actor: { ar: "ممثل", en: "Actor" },
  model: { ar: "مودل", en: "Model" },
  modeling: { ar: "مودل", en: "Modeling" },
  presenting: { ar: "تقديم", en: "Presenting" },
  sports: { ar: "رياضة", en: "Sports" },
  voice_over: { ar: "تعليق صوتي", en: "Voice over" },
  arabic: { ar: "العربية", en: "Arabic" },
  english: { ar: "الإنجليزية", en: "English" },
  french: { ar: "الفرنسية", en: "French" },
  urdu: { ar: "الأردية", en: "Urdu" },
  najdi: { ar: "نجدي", en: "Najdi" },
  hijazi: { ar: "حجازي", en: "Hijazi" },
  gulf: { ar: "خليجي", en: "Gulf" },
  levantine: { ar: "شامي", en: "Levantine" },
};

export function displayValue(value: string | null | undefined, locale: AppLocale) {
  if (!value) return null;
  const key = value.trim().toLowerCase();
  return VALUES[key]?.[locale] ?? value.replace(/_/g, " ");
}

export function displayValues(values: Array<string | null | undefined>, locale: AppLocale) {
  return [...new Set(values.map((value) => displayValue(value, locale)).filter((value): value is string => Boolean(value)))];
}
