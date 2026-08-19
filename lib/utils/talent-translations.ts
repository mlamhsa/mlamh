export type TalentLocale = "ar" | "en";

type TranslationMap = Record<
  string,
  {
    ar: string;
    en: string;
  }
>;

const GENDER_TRANSLATIONS: TranslationMap = {
  male: { ar: "ذكر", en: "Male" },
  female: { ar: "أنثى", en: "Female" },
  other: { ar: "آخر", en: "Other" },

  ذكر: { ar: "ذكر", en: "Male" },
  أنثى: { ar: "أنثى", en: "Female" },
};

const AVAILABILITY_TRANSLATIONS: TranslationMap = {
  available: { ar: "متاح حاليًا", en: "Available now" },
  unavailable: { ar: "غير متاح حاليًا", en: "Unavailable" },
  busy: { ar: "مشغول حاليًا", en: "Currently busy" },

  available_this_week: {
    ar: "متاح هذا الأسبوع",
    en: "Available this week",
  },

  "available now": { ar: "متاح حاليًا", en: "Available now" },
  "not available": { ar: "غير متاح حاليًا", en: "Unavailable" },

  متاح: { ar: "متاح حاليًا", en: "Available now" },
  "متاح حالياً": { ar: "متاح حاليًا", en: "Available now" },
  "متاح حاليًا": { ar: "متاح حاليًا", en: "Available now" },
};

const STATUS_TRANSLATIONS: TranslationMap = {
  draft: { ar: "مسودة", en: "Draft" },
  pending: { ar: "قيد المراجعة", en: "Pending review" },
  pending_review: { ar: "قيد المراجعة", en: "Pending review" },
  approved: { ar: "معتمد", en: "Approved" },
  rejected: { ar: "مرفوض", en: "Rejected" },
  suspended: { ar: "موقوف", en: "Suspended" },

  معتمد: { ar: "معتمد", en: "Approved" },
  مرفوض: { ar: "مرفوض", en: "Rejected" },
};

const HAIR_COLOR_TRANSLATIONS: TranslationMap = {
  black: { ar: "أسود", en: "Black" },
  brown: { ar: "بني", en: "Brown" },
  blonde: { ar: "أشقر", en: "Blonde" },
  blond: { ar: "أشقر", en: "Blonde" },
  red: { ar: "أحمر", en: "Red" },
  gray: { ar: "رمادي", en: "Gray" },
  grey: { ar: "رمادي", en: "Gray" },
  white: { ar: "أبيض", en: "White" },
  auburn: { ar: "كستنائي محمر", en: "Auburn" },
  dark_brown: { ar: "بني داكن", en: "Dark brown" },
  light_brown: { ar: "بني فاتح", en: "Light brown" },

  أسود: { ar: "أسود", en: "Black" },
  بني: { ar: "بني", en: "Brown" },
  أشقر: { ar: "أشقر", en: "Blonde" },
  أحمر: { ar: "أحمر", en: "Red" },
  رمادي: { ar: "رمادي", en: "Gray" },
  أبيض: { ar: "أبيض", en: "White" },
};

const EYE_COLOR_TRANSLATIONS: TranslationMap = {
  black: { ar: "أسود", en: "Black" },
  brown: { ar: "بني", en: "Brown" },
  blue: { ar: "أزرق", en: "Blue" },
  green: { ar: "أخضر", en: "Green" },
  hazel: { ar: "عسلي", en: "Hazel" },
  gray: { ar: "رمادي", en: "Gray" },
  grey: { ar: "رمادي", en: "Gray" },
  amber: { ar: "كهرماني", en: "Amber" },

  أسود: { ar: "أسود", en: "Black" },
  بني: { ar: "بني", en: "Brown" },
  أزرق: { ar: "أزرق", en: "Blue" },
  أخضر: { ar: "أخضر", en: "Green" },
  عسلي: { ar: "عسلي", en: "Hazel" },
  رمادي: { ar: "رمادي", en: "Gray" },
};

const HAIR_TYPE_TRANSLATIONS: TranslationMap = {
  straight: { ar: "مستقيم", en: "Straight" },
  wavy: { ar: "مموج", en: "Wavy" },
  curly: { ar: "مجعد", en: "Curly" },
  coily: { ar: "شديد التجعد", en: "Coily" },
  bald: { ar: "أصلع", en: "Bald" },

  مستقيم: { ar: "مستقيم", en: "Straight" },
  مموج: { ar: "مموج", en: "Wavy" },
  مجعد: { ar: "مجعد", en: "Curly" },
};

const SKIN_TONE_TRANSLATIONS: TranslationMap = {
  fair: { ar: "فاتح", en: "Fair" },
  light: { ar: "فاتح", en: "Light" },
  medium: { ar: "متوسط", en: "Medium" },
  olive: { ar: "حنطي", en: "Olive" },
  tan: { ar: "أسمر فاتح", en: "Tan" },
  brown: { ar: "أسمر", en: "Brown" },
  dark: { ar: "داكن", en: "Dark" },
  deep: { ar: "داكن", en: "Deep" },

  فاتح: { ar: "فاتح", en: "Fair" },
  متوسط: { ar: "متوسط", en: "Medium" },
  حنطي: { ar: "حنطي", en: "Olive" },
  أسمر: { ar: "أسمر", en: "Brown" },
  داكن: { ar: "داكن", en: "Dark" },
};

const LANGUAGE_TRANSLATIONS: TranslationMap = {
  arabic: { ar: "العربية", en: "Arabic" },
  english: { ar: "الإنجليزية", en: "English" },
  french: { ar: "الفرنسية", en: "French" },
  spanish: { ar: "الإسبانية", en: "Spanish" },
  german: { ar: "الألمانية", en: "German" },
  italian: { ar: "الإيطالية", en: "Italian" },
  turkish: { ar: "التركية", en: "Turkish" },
  urdu: { ar: "الأردية", en: "Urdu" },
  hindi: { ar: "الهندية", en: "Hindi" },
  persian: { ar: "الفارسية", en: "Persian" },

  العربية: { ar: "العربية", en: "Arabic" },
  الإنجليزية: { ar: "الإنجليزية", en: "English" },
  الفرنسية: { ar: "الفرنسية", en: "French" },
};

const DIALECT_TRANSLATIONS: TranslationMap = {
  hejazi: { ar: "حجازية", en: "Hejazi" },
  hijazi: { ar: "حجازية", en: "Hejazi" },
  najdi: { ar: "نجدية", en: "Najdi" },
  gulf: { ar: "خليجية", en: "Gulf" },
  khaliji: { ar: "خليجية", en: "Gulf" },
  southern: { ar: "جنوبية", en: "Southern" },
  northern: { ar: "شمالية", en: "Northern" },
  levantine: { ar: "شامية", en: "Levantine" },
  egyptian: { ar: "مصرية", en: "Egyptian" },
  iraqi: { ar: "عراقية", en: "Iraqi" },
  yemeni: { ar: "يمنية", en: "Yemeni" },

  حجازية: { ar: "حجازية", en: "Hejazi" },
  نجدية: { ar: "نجدية", en: "Najdi" },
  خليجية: { ar: "خليجية", en: "Gulf" },
  جنوبية: { ar: "جنوبية", en: "Southern" },
};

const SKILL_TRANSLATIONS: TranslationMap = {
  acting: { ar: "تمثيل", en: "Acting" },
  actor: { ar: "تمثيل", en: "Acting" },
  modeling: { ar: "عرض أزياء", en: "Modeling" },
  model: { ar: "عرض أزياء", en: "Modeling" },
  presenting: { ar: "تقديم", en: "Presenting" },
  presenter: { ar: "تقديم", en: "Presenting" },
  "voice over": { ar: "تعليق صوتي", en: "Voice over" },
  voice_over: { ar: "تعليق صوتي", en: "Voice over" },
  voiceover: { ar: "تعليق صوتي", en: "Voice over" },
  singing: { ar: "غناء", en: "Singing" },
  dancing: { ar: "رقص", en: "Dancing" },
  photography: { ar: "تصوير", en: "Photography" },
  content_creation: { ar: "صناعة محتوى", en: "Content creation" },
  "content creation": { ar: "صناعة محتوى", en: "Content creation" },
  influencer: { ar: "صناعة محتوى", en: "Influencing" },
  hosting: { ar: "تقديم فعاليات", en: "Event hosting" },
  sports: { ar: "رياضة", en: "Sports" },

  تمثيل: { ar: "تمثيل", en: "Acting" },
  تقديم: { ar: "تقديم", en: "Presenting" },
  "تعليق صوتي": { ar: "تعليق صوتي", en: "Voice over" },
  غناء: { ar: "غناء", en: "Singing" },
  رقص: { ar: "رقص", en: "Dancing" },
};

const CATEGORY_TRANSLATIONS: TranslationMap = {
  actor: { ar: "ممثل", en: "Actor" },
  actress: { ar: "ممثلة", en: "Actress" },
  model: { ar: "مودل", en: "Model" },
  presenter: { ar: "مقدم برامج", en: "Presenter" },
  voice_actor: { ar: "مؤدي صوتي", en: "Voice actor" },
  singer: { ar: "مغنٍ", en: "Singer" },
  dancer: { ar: "راقص", en: "Dancer" },
  athlete: { ar: "رياضي", en: "Athlete" },
  extra: { ar: "كومبارس", en: "Extra" },
  influencer: { ar: "مؤثر", en: "Influencer" },
  content_creator: { ar: "صانع محتوى", en: "Content creator" },

  ممثل: { ar: "ممثل", en: "Actor" },
  ممثلة: { ar: "ممثلة", en: "Actress" },
  مودل: { ar: "مودل", en: "Model" },
};

const NATIONALITY_TRANSLATIONS: TranslationMap = {
  saudi: { ar: "سعودي", en: "Saudi" },
  kuwaiti: { ar: "كويتي", en: "Kuwaiti" },
  emirati: { ar: "إماراتي", en: "Emirati" },
  bahraini: { ar: "بحريني", en: "Bahraini" },
  qatari: { ar: "قطري", en: "Qatari" },
  omani: { ar: "عُماني", en: "Omani" },
  yemeni: { ar: "يمني", en: "Yemeni" },
  egyptian: { ar: "مصري", en: "Egyptian" },
  jordanian: { ar: "أردني", en: "Jordanian" },
  lebanese: { ar: "لبناني", en: "Lebanese" },
  syrian: { ar: "سوري", en: "Syrian" },
  iraqi: { ar: "عراقي", en: "Iraqi" },
  palestinian: { ar: "فلسطيني", en: "Palestinian" },
  moroccan: { ar: "مغربي", en: "Moroccan" },
  tunisian: { ar: "تونسي", en: "Tunisian" },
  algerian: { ar: "جزائري", en: "Algerian" },
  sudanese: { ar: "سوداني", en: "Sudanese" },
  libyan: { ar: "ليبي", en: "Libyan" },

  saudi_arabian: { ar: "سعودي", en: "Saudi" },
  united_arab_emirates: { ar: "إماراتي", en: "Emirati" },

  سعودي: { ar: "سعودي", en: "Saudi" },
  كويتي: { ar: "كويتي", en: "Kuwaiti" },
  إماراتي: { ar: "إماراتي", en: "Emirati" },
  بحريني: { ar: "بحريني", en: "Bahraini" },
  قطري: { ar: "قطري", en: "Qatari" },
  عماني: { ar: "عُماني", en: "Omani" },
  عُماني: { ar: "عُماني", en: "Omani" },
  يمني: { ar: "يمني", en: "Yemeni" },
  مصري: { ar: "مصري", en: "Egyptian" },
  أردني: { ar: "أردني", en: "Jordanian" },
  لبناني: { ar: "لبناني", en: "Lebanese" },
  سوري: { ar: "سوري", en: "Syrian" },
  عراقي: { ar: "عراقي", en: "Iraqi" },
  فلسطيني: { ar: "فلسطيني", en: "Palestinian" },
  مغربي: { ar: "مغربي", en: "Moroccan" },
  تونسي: { ar: "تونسي", en: "Tunisian" },
  جزائري: { ar: "جزائري", en: "Algerian" },
  سوداني: { ar: "سوداني", en: "Sudanese" },
  ليبي: { ar: "ليبي", en: "Libyan" },
};

const BOOLEAN_TRANSLATIONS: TranslationMap = {
  true: { ar: "نعم", en: "Yes" },
  false: { ar: "لا", en: "No" },
  yes: { ar: "نعم", en: "Yes" },
  no: { ar: "لا", en: "No" },
  نعم: { ar: "نعم", en: "Yes" },
  لا: { ar: "لا", en: "No" },
};

const TRANSLATION_GROUPS = {
  gender: GENDER_TRANSLATIONS,
  availability: AVAILABILITY_TRANSLATIONS,
  status: STATUS_TRANSLATIONS,
  hairColor: HAIR_COLOR_TRANSLATIONS,
  eyeColor: EYE_COLOR_TRANSLATIONS,
  hairType: HAIR_TYPE_TRANSLATIONS,
  skinTone: SKIN_TONE_TRANSLATIONS,
  language: LANGUAGE_TRANSLATIONS,
  dialect: DIALECT_TRANSLATIONS,
  skill: SKILL_TRANSLATIONS,
  category: CATEGORY_TRANSLATIONS,
  nationality: NATIONALITY_TRANSLATIONS,
  boolean: BOOLEAN_TRANSLATIONS,
} as const;

export type TalentTranslationGroup = keyof typeof TRANSLATION_GROUPS;

function normalizeKey(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/-/g, "_")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function translateTalentValue(
  locale: TalentLocale,
  group: TalentTranslationGroup,
  value: unknown
): string {
  const originalValue = String(value ?? "").trim();

  if (!originalValue) {
    return "";
  }

  const translations = TRANSLATION_GROUPS[group];

  const normalizedKey = normalizeKey(originalValue);

  const directMatch =
    translations[normalizedKey as keyof typeof translations];

  if (directMatch) {
    return directMatch[locale];
  }

  const underscoreMatch =
    translations[
      normalizedKey.replace(/\s+/g, "_") as keyof typeof translations
    ];

  if (underscoreMatch) {
    return underscoreMatch[locale];
  }

  const originalMatch =
    translations[originalValue as keyof typeof translations];

  if (originalMatch) {
    return originalMatch[locale];
  }

  return originalValue;
}

export function translateTalentValues(
  locale: TalentLocale,
  group: TalentTranslationGroup,
  values: unknown
): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((value) => translateTalentValue(locale, group, value))
    .filter(Boolean);
}

export function hasDisplayValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    return ![
      "",
      "-",
      "—",
      "null",
      "undefined",
      "n/a",
      "na",
      "not specified",
    ].includes(normalized);
  }

  if (Array.isArray(value)) {
    return value.some(hasDisplayValue);
  }

  return true;
}

export function formatBooleanTalentValue(
  locale: TalentLocale,
  value: unknown
): string {
  if (typeof value === "boolean") {
    return value
      ? locale === "ar"
        ? "نعم"
        : "Yes"
      : locale === "ar"
        ? "لا"
        : "No";
  }

  return translateTalentValue(locale, "boolean", value);
}