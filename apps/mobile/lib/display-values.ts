import type { AppLocale } from "@/lib/i18n";

const VALUES: Record<string, { ar: string; en: string }> = {
  sa: { ar: "السعودية", en: "Saudi Arabia" },
  ae: { ar: "الإمارات", en: "UAE" },
  qa: { ar: "قطر", en: "Qatar" },
  eg: { ar: "مصر", en: "Egypt" },
  ma: { ar: "المغرب", en: "Morocco" },
  saudi: { ar: "سعودي", en: "Saudi" },
  egyptian: { ar: "مصري", en: "Egyptian" },
  moroccan: { ar: "مغربي", en: "Moroccan" },
  male: { ar: "ذكر", en: "Male" },
  female: { ar: "أنثى", en: "Female" },
  any: { ar: "الجميع", en: "Any" },
  northern: { ar: "شمالي", en: "Northern" },
  central: { ar: "وسطي", en: "Central" },
  southern: { ar: "جنوبي", en: "Southern" },
  western: { ar: "غربي", en: "Western" },
  eastern: { ar: "شرقي", en: "Eastern" },
  available_now: { ar: "متاح الآن", en: "Available now" },
  available_this_week: { ar: "متاح هذا الأسبوع", en: "Available this week" },
  available_next_month: { ar: "متاح الشهر القادم", en: "Available next month" },
  unavailable: { ar: "غير متاح", en: "Unavailable" },
  acting: { ar: "تمثيل", en: "Acting" },
  actor: { ar: "ممثل", en: "Actor" },
  model: { ar: "مودل", en: "Model" },
  modeling: { ar: "مودل", en: "Modeling" },
  presenting: { ar: "تقديم", en: "Presenting" },
  sports: { ar: "رياضة", en: "Sports" },
  singing: { ar: "غناء", en: "Singing" },
  dancing: { ar: "رقص", en: "Dancing" },
  voice_over: { ar: "تعليق صوتي", en: "Voice over" },
  commercial: { ar: "إعلاني", en: "Commercial" },
  fashion: { ar: "أزياء", en: "Fashion" },
  beauty: { ar: "جمال", en: "Beauty" },
  lifestyle: { ar: "لايف ستايل", en: "Lifestyle" },
  ecommerce: { ar: "متاجر إلكترونية", en: "E-commerce" },
  arabic: { ar: "العربية", en: "Arabic" },
  english: { ar: "الإنجليزية", en: "English" },
  french: { ar: "الفرنسية", en: "French" },
  urdu: { ar: "الأردية", en: "Urdu" },
  turkish: { ar: "التركية", en: "Turkish" },
  najdi: { ar: "نجدي", en: "Najdi" },
  hijazi: { ar: "حجازي", en: "Hijazi" },
  hejazi: { ar: "حجازي", en: "Hejazi" },
  gulf: { ar: "خليجي", en: "Gulf" },
  levantine: { ar: "شامي", en: "Levantine" },
  black: { ar: "أسود", en: "Black" },
  brown: { ar: "بني", en: "Brown" },
  blonde: { ar: "أشقر", en: "Blonde" },
  red: { ar: "أحمر", en: "Red" },
  gray: { ar: "رمادي", en: "Gray" },
  white: { ar: "أبيض", en: "White" },
  dyed: { ar: "مصبوغ", en: "Dyed" },
  bald: { ar: "أصلع", en: "Bald" },
  straight: { ar: "مستقيم", en: "Straight" },
  wavy: { ar: "مموج", en: "Wavy" },
  curly: { ar: "مجعد", en: "Curly" },
  coily: { ar: "شديد التجعد", en: "Coily" },
  covered: { ar: "مغطى", en: "Covered" },
};

export function displayValue(value: string | null | undefined, locale: AppLocale) {
  if (!value) return null;
  const key = value.trim().toLowerCase();
  return VALUES[key]?.[locale] ?? value.replace(/_/g, " ");
}

export function displayValues(values: Array<string | null | undefined>, locale: AppLocale) {
  return [...new Set(values.map((value) => displayValue(value, locale)).filter((value): value is string => Boolean(value)))];
}
