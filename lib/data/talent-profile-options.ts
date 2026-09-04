export type LocalizedTalentOption = { value: string; ar: string; en: string };

export const PRIMARY_ROLE_OPTIONS: LocalizedTalentOption[] = [
  { value: "actor", ar: "ممثل", en: "Actor" },
  { value: "model", ar: "مودل", en: "Model" },
];

export const GENDER_OPTIONS: LocalizedTalentOption[] = [
  { value: "male", ar: "ذكر", en: "Male" },
  { value: "female", ar: "أنثى", en: "Female" },
];

export const AVAILABILITY_OPTIONS: LocalizedTalentOption[] = [
  { value: "available_now", ar: "متاح الآن", en: "Available Now" },
  { value: "available_this_week", ar: "متاح هذا الأسبوع", en: "Available This Week" },
  { value: "available_next_month", ar: "متاح الشهر القادم", en: "Available Next Month" },
  { value: "unavailable", ar: "غير متاح", en: "Unavailable" },
];

export const EYE_COLOR_OPTIONS: LocalizedTalentOption[] = [
  { value: "brown", ar: "بني", en: "Brown" },
  { value: "black", ar: "أسود", en: "Black" },
  { value: "blue", ar: "أزرق", en: "Blue" },
  { value: "green", ar: "أخضر", en: "Green" },
  { value: "hazel", ar: "عسلي", en: "Hazel" },
  { value: "gray", ar: "رمادي", en: "Gray" },
];

export const HAIR_COLOR_OPTIONS: LocalizedTalentOption[] = [
  { value: "black", ar: "أسود", en: "Black" },
  { value: "brown", ar: "بني", en: "Brown" },
  { value: "blonde", ar: "أشقر", en: "Blonde" },
  { value: "red", ar: "أحمر", en: "Red" },
  { value: "gray", ar: "رمادي", en: "Gray" },
  { value: "white", ar: "أبيض", en: "White" },
  { value: "dyed", ar: "مصبوغ", en: "Dyed" },
  { value: "bald", ar: "أصلع", en: "Bald" },
];

export const HAIR_TYPE_OPTIONS: LocalizedTalentOption[] = [
  { value: "straight", ar: "مستقيم", en: "Straight" },
  { value: "wavy", ar: "مموج", en: "Wavy" },
  { value: "curly", ar: "مجعد", en: "Curly" },
  { value: "coily", ar: "شديد التجعد", en: "Coily" },
  { value: "bald", ar: "أصلع", en: "Bald" },
  { value: "covered", ar: "مغطى", en: "Covered" },
];

export const SKIN_COLOR_OPTIONS: LocalizedTalentOption[] = [
  { value: "fair", ar: "فاتحة جدًا", en: "Fair" },
  { value: "light", ar: "فاتحة", en: "Light" },
  { value: "medium", ar: "متوسطة", en: "Medium" },
  { value: "olive", ar: "قمحية", en: "Olive" },
  { value: "tan", ar: "سمراء فاتحة", en: "Tan" },
  { value: "brown", ar: "بنية", en: "Brown" },
  { value: "dark", ar: "داكنة", en: "Dark" },
];

export const CLOTHING_SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"] as const;
