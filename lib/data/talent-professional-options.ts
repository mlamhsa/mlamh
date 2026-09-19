export type TalentProfessionalChoice = {
  value: string;
  ar: string;
  en: string;
};

export const TALENT_LANGUAGE_CHOICES: TalentProfessionalChoice[] = [
  { value: "arabic", ar: "العربية", en: "Arabic" },
  { value: "english", ar: "الإنجليزية", en: "English" },
  { value: "french", ar: "الفرنسية", en: "French" },
  { value: "spanish", ar: "الإسبانية", en: "Spanish" },
  { value: "turkish", ar: "التركية", en: "Turkish" },
  { value: "urdu", ar: "الأردية", en: "Urdu" },
  { value: "hindi", ar: "الهندية", en: "Hindi" },
  { value: "persian", ar: "الفارسية", en: "Persian" },
  { value: "german", ar: "الألمانية", en: "German" },
  { value: "italian", ar: "الإيطالية", en: "Italian" },
];

export const TALENT_DIALECT_CHOICES: TalentProfessionalChoice[] = [
  { value: "saudi", ar: "سعودية", en: "Saudi" },
  { value: "najdi", ar: "نجدية", en: "Najdi" },
  { value: "hijazi", ar: "حجازية", en: "Hijazi" },
  { value: "southern", ar: "جنوبية", en: "Southern" },
  { value: "northern", ar: "شمالية", en: "Northern" },
  { value: "gulf", ar: "خليجية", en: "Gulf" },
  { value: "egyptian", ar: "مصرية", en: "Egyptian" },
  { value: "levantine", ar: "شامية", en: "Levantine" },
  { value: "iraqi", ar: "عراقية", en: "Iraqi" },
  { value: "yemeni", ar: "يمنية", en: "Yemeni" },
  { value: "maghrebi", ar: "مغاربية", en: "Maghrebi" },
  { value: "msa", ar: "العربية الفصحى", en: "Modern Standard Arabic" },
];

export const ACTOR_SKILL_CHOICES: TalentProfessionalChoice[] = [
  { value: "acting", ar: "تمثيل", en: "Acting" },
  { value: "improv", ar: "ارتجال", en: "Improvisation" },
  { value: "comedy", ar: "كوميديا", en: "Comedy" },
  { value: "drama", ar: "دراما", en: "Drama" },
  { value: "action", ar: "أكشن", en: "Action" },
  { value: "voice_over", ar: "تعليق صوتي", en: "Voice over" },
  { value: "presenting", ar: "تقديم", en: "Presenting" },
  { value: "modeling", ar: "عرض أزياء", en: "Modeling" },
  { value: "singing", ar: "غناء", en: "Singing" },
  { value: "dancing", ar: "رقص", en: "Dancing" },
  { value: "sports", ar: "رياضة", en: "Sports" },
  { value: "martial_arts", ar: "فنون قتالية", en: "Martial arts" },
  { value: "horse_riding", ar: "ركوب الخيل", en: "Horse riding" },
  { value: "swimming", ar: "سباحة", en: "Swimming" },
  { value: "driving", ar: "قيادة", en: "Driving" },
];

export const MODEL_TYPE_CHOICES: TalentProfessionalChoice[] = [
  { value: "commercial", ar: "إعلانات وبراندات", en: "Commercial" },
  { value: "fashion", ar: "أزياء وتصوير ملابس", en: "Fashion" },
  { value: "runway", ar: "عروض أزياء على المنصة", en: "Runway" },
  { value: "beauty", ar: "مكياج وعناية وجمال", en: "Beauty" },
  { value: "fitness", ar: "رياضة ولياقة", en: "Fitness" },
  { value: "fit", ar: "تجربة وقياسات الملابس", en: "Fit model" },
  { value: "promotional", ar: "فعاليات وترويج", en: "Promotional" },
  { value: "ecommerce", ar: "متاجر إلكترونية وكتالوج", en: "E-commerce / Catalog" },
  { value: "lifestyle", ar: "تصوير يومي ولايف ستايل", en: "Lifestyle" },
  { value: "product", ar: "تصوير واستخدام المنتجات", en: "Product" },
  { value: "hand", ar: "يد — مجوهرات ومنتجات", en: "Parts — Hand" },
  { value: "foot", ar: "قدم — أحذية وإكسسوارات", en: "Parts — Foot" },
  { value: "legs", ar: "ساق — أزياء ومنتجات", en: "Parts — Legs" },
  { value: "hair", ar: "شعر — عناية وتصفيف", en: "Parts — Hair" },
  { value: "eyes", ar: "عيون — نظارات وعدسات وجمال", en: "Parts — Eyes" },
  { value: "smile", ar: "ابتسامة وأسنان — عناية وجمال", en: "Parts — Smile / Teeth" },
];

export const MODEL_PARTS_TYPE_VALUES = new Set(["hand", "foot", "legs", "hair", "eyes", "smile"]);

export function getModelTypeLabel(value: string, locale: "ar" | "en") {
  const option = MODEL_TYPE_CHOICES.find((item) => item.value === value);
  if (option) return locale === "ar" ? option.ar : option.en;
  return value.replaceAll("_", " ");
}

export const EYE_COLOR_CHOICES: TalentProfessionalChoice[] = [
  { value: "brown", ar: "بني", en: "Brown" },
  { value: "dark_brown", ar: "بني داكن", en: "Dark brown" },
  { value: "hazel", ar: "عسلي", en: "Hazel" },
  { value: "black", ar: "أسود", en: "Black" },
  { value: "blue", ar: "أزرق", en: "Blue" },
  { value: "green", ar: "أخضر", en: "Green" },
  { value: "gray", ar: "رمادي", en: "Gray" },
];

export const HAIR_COLOR_CHOICES: TalentProfessionalChoice[] = [
  { value: "black", ar: "أسود", en: "Black" },
  { value: "dark_brown", ar: "بني داكن", en: "Dark brown" },
  { value: "brown", ar: "بني", en: "Brown" },
  { value: "light_brown", ar: "بني فاتح", en: "Light brown" },
  { value: "blonde", ar: "أشقر", en: "Blonde" },
  { value: "red", ar: "أحمر", en: "Red" },
  { value: "gray", ar: "رمادي", en: "Gray" },
  { value: "white", ar: "أبيض", en: "White" },
  { value: "dyed", ar: "مصبوغ", en: "Dyed" },
  { value: "bald", ar: "أصلع", en: "Bald" },
];

export const HAIR_TYPE_CHOICES: TalentProfessionalChoice[] = [
  { value: "straight", ar: "مستقيم", en: "Straight" },
  { value: "wavy", ar: "مموج", en: "Wavy" },
  { value: "curly", ar: "مجعد", en: "Curly" },
  { value: "coily", ar: "شديد التجعد", en: "Coily" },
  { value: "bald", ar: "أصلع", en: "Bald" },
  { value: "covered", ar: "مغطى", en: "Covered" },
];

export const SKIN_TONE_CHOICES: TalentProfessionalChoice[] = [
  { value: "fair", ar: "فاتحة جدًا", en: "Fair" },
  { value: "light", ar: "فاتحة", en: "Light" },
  { value: "medium", ar: "متوسطة", en: "Medium" },
  { value: "olive", ar: "قمحية", en: "Olive" },
  { value: "tan", ar: "سمراء فاتحة", en: "Tan" },
  { value: "brown", ar: "بنية", en: "Brown" },
  { value: "dark", ar: "داكنة", en: "Dark" },
];

export const AVAILABILITY_CHOICES: TalentProfessionalChoice[] = [
  { value: "available_now", ar: "متاح الآن", en: "Available now" },
  { value: "available_this_week", ar: "متاح هذا الأسبوع", en: "Available this week" },
  { value: "available_next_month", ar: "متاح الشهر القادم", en: "Available next month" },
  { value: "unavailable", ar: "غير متاح حاليًا", en: "Unavailable" },
];

export const CLOTHING_SIZE_CHOICES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"] as const;
