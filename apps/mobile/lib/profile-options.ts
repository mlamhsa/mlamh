export type MobileOption = { value: string; ar: string; en: string };

export const TALENT_GENDER_OPTIONS: MobileOption[] = [
  { value: "male", ar: "ذكر", en: "Male" },
  { value: "female", ar: "أنثى", en: "Female" },
];

export const TALENT_AVAILABILITY_OPTIONS: MobileOption[] = [
  { value: "available_now", ar: "متاح الآن", en: "Available Now" },
  { value: "available_this_week", ar: "متاح هذا الأسبوع", en: "Available This Week" },
  { value: "available_next_month", ar: "متاح الشهر القادم", en: "Available Next Month" },
  { value: "unavailable", ar: "غير متاح", en: "Unavailable" },
];

export const EYE_COLOR_OPTIONS: MobileOption[] = [
  { value: "brown", ar: "بني", en: "Brown" }, { value: "black", ar: "أسود", en: "Black" }, { value: "blue", ar: "أزرق", en: "Blue" }, { value: "green", ar: "أخضر", en: "Green" }, { value: "hazel", ar: "عسلي", en: "Hazel" }, { value: "gray", ar: "رمادي", en: "Gray" },
];
export const HAIR_COLOR_OPTIONS: MobileOption[] = [
  { value: "black", ar: "أسود", en: "Black" }, { value: "brown", ar: "بني", en: "Brown" }, { value: "blonde", ar: "أشقر", en: "Blonde" }, { value: "red", ar: "أحمر", en: "Red" }, { value: "gray", ar: "رمادي", en: "Gray" }, { value: "white", ar: "أبيض", en: "White" }, { value: "dyed", ar: "مصبوغ", en: "Dyed" }, { value: "bald", ar: "أصلع", en: "Bald" },
];
export const HAIR_TYPE_OPTIONS: MobileOption[] = [
  { value: "straight", ar: "مستقيم", en: "Straight" }, { value: "wavy", ar: "مموج", en: "Wavy" }, { value: "curly", ar: "مجعد", en: "Curly" }, { value: "coily", ar: "شديد التجعد", en: "Coily" }, { value: "bald", ar: "أصلع", en: "Bald" }, { value: "covered", ar: "مغطى", en: "Covered" },
];
export const SKIN_COLOR_OPTIONS: MobileOption[] = [
  { value: "fair", ar: "فاتحة جدًا", en: "Fair" }, { value: "light", ar: "فاتحة", en: "Light" }, { value: "medium", ar: "متوسطة", en: "Medium" }, { value: "olive", ar: "قمحية", en: "Olive" }, { value: "tan", ar: "سمراء فاتحة", en: "Tan" }, { value: "brown", ar: "بنية", en: "Brown" }, { value: "dark", ar: "داكنة", en: "Dark" },
];
export const CLOTHING_SIZE_OPTIONS: MobileOption[] = ["XS", "S", "M", "L", "XL", "XXL"].map((value) => ({ value, ar: value, en: value }));

export const SAUDI_CITY_OPTIONS: MobileOption[] = [
  { value: "riyadh", ar: "الرياض", en: "Riyadh" }, { value: "jeddah", ar: "جدة", en: "Jeddah" }, { value: "makkah", ar: "مكة", en: "Makkah" }, { value: "madinah", ar: "المدينة المنورة", en: "Madinah" }, { value: "dammam", ar: "الدمام", en: "Dammam" }, { value: "khobar", ar: "الخبر", en: "Khobar" }, { value: "dhahran", ar: "الظهران", en: "Dhahran" }, { value: "taif", ar: "الطائف", en: "Taif" }, { value: "tabuk", ar: "تبوك", en: "Tabuk" }, { value: "abha", ar: "أبها", en: "Abha" }, { value: "khamis-mushait", ar: "خميس مشيط", en: "Khamis Mushait" }, { value: "hail", ar: "حائل", en: "Hail" }, { value: "buraydah", ar: "بريدة", en: "Buraydah" }, { value: "unayzah", ar: "عنيزة", en: "Unayzah" }, { value: "jubail", ar: "الجبيل", en: "Jubail" }, { value: "yanbu", ar: "ينبع", en: "Yanbu" }, { value: "najran", ar: "نجران", en: "Najran" }, { value: "jazan", ar: "جازان", en: "Jazan" }, { value: "arar", ar: "عرعر", en: "Arar" }, { value: "sakaka", ar: "سكاكا", en: "Sakaka" }, { value: "al-baha", ar: "الباحة", en: "Al Baha" },
];
