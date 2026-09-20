import { NATIONALITIES } from "@/lib/data/nationalities";
import { SAUDI_CITIES } from "@/lib/data/saudi-cities";

export type TalentSignupCountry = {
  code: string;
  dialCode: string;
  ar: string;
  en: string;
  phoneExample: string;
  cities: { value: string; ar: string; en: string }[];
};

export const TALENT_SIGNUP_COUNTRIES: TalentSignupCountry[] = [
  {
    code: "SA",
    dialCode: "+966",
    ar: "السعودية",
    en: "Saudi Arabia",
    phoneExample: "5XXXXXXXX",
    cities: SAUDI_CITIES.map((city) => ({ value: city.slug, ar: city.ar, en: city.en })),
  },
  {
    code: "AE",
    dialCode: "+971",
    ar: "الإمارات العربية المتحدة",
    en: "United Arab Emirates",
    phoneExample: "5XXXXXXXX",
    cities: [
      { value: "dubai", ar: "دبي", en: "Dubai" },
      { value: "abu_dhabi", ar: "أبوظبي", en: "Abu Dhabi" },
      { value: "sharjah", ar: "الشارقة", en: "Sharjah" },
      { value: "ajman", ar: "عجمان", en: "Ajman" },
      { value: "ras_al_khaimah", ar: "رأس الخيمة", en: "Ras Al Khaimah" },
      { value: "fujairah", ar: "الفجيرة", en: "Fujairah" },
      { value: "umm_al_quwain", ar: "أم القيوين", en: "Umm Al Quwain" },
      { value: "other", ar: "مدينة أخرى", en: "Other city" },
    ],
  },
  {
    code: "QA",
    dialCode: "+974",
    ar: "قطر",
    en: "Qatar",
    phoneExample: "XXXXXXXX",
    cities: [
      { value: "doha", ar: "الدوحة", en: "Doha" },
      { value: "al_rayyan", ar: "الريان", en: "Al Rayyan" },
      { value: "al_wakrah", ar: "الوكرة", en: "Al Wakrah" },
      { value: "other", ar: "مدينة أخرى", en: "Other city" },
    ],
  },
  {
    code: "KW",
    dialCode: "+965",
    ar: "الكويت",
    en: "Kuwait",
    phoneExample: "XXXXXXXX",
    cities: [
      { value: "kuwait_city", ar: "مدينة الكويت", en: "Kuwait City" },
      { value: "hawalli", ar: "حولي", en: "Hawalli" },
      { value: "farwaniya", ar: "الفروانية", en: "Farwaniya" },
      { value: "other", ar: "مدينة أخرى", en: "Other city" },
    ],
  },
  {
    code: "BH",
    dialCode: "+973",
    ar: "البحرين",
    en: "Bahrain",
    phoneExample: "XXXXXXXX",
    cities: [
      { value: "manama", ar: "المنامة", en: "Manama" },
      { value: "muharraq", ar: "المحرق", en: "Muharraq" },
      { value: "riffa", ar: "الرفاع", en: "Riffa" },
      { value: "other", ar: "مدينة أخرى", en: "Other city" },
    ],
  },
  {
    code: "OM",
    dialCode: "+968",
    ar: "عُمان",
    en: "Oman",
    phoneExample: "XXXXXXXX",
    cities: [
      { value: "muscat", ar: "مسقط", en: "Muscat" },
      { value: "salalah", ar: "صلالة", en: "Salalah" },
      { value: "sohar", ar: "صحار", en: "Sohar" },
      { value: "other", ar: "مدينة أخرى", en: "Other city" },
    ],
  },
  {
    code: "EG",
    dialCode: "+20",
    ar: "مصر",
    en: "Egypt",
    phoneExample: "1XXXXXXXXX",
    cities: [
      { value: "cairo", ar: "القاهرة", en: "Cairo" },
      { value: "giza", ar: "الجيزة", en: "Giza" },
      { value: "alexandria", ar: "الإسكندرية", en: "Alexandria" },
      { value: "other", ar: "مدينة أخرى", en: "Other city" },
    ],
  },
  {
    code: "MA",
    dialCode: "+212",
    ar: "المغرب",
    en: "Morocco",
    phoneExample: "6XXXXXXXX",
    cities: [
      { value: "casablanca", ar: "الدار البيضاء", en: "Casablanca" },
      { value: "rabat", ar: "الرباط", en: "Rabat" },
      { value: "marrakesh", ar: "مراكش", en: "Marrakesh" },
      { value: "tangier", ar: "طنجة", en: "Tangier" },
      { value: "other", ar: "مدينة أخرى", en: "Other city" },
    ],
  },
  {
    code: "JO",
    dialCode: "+962",
    ar: "الأردن",
    en: "Jordan",
    phoneExample: "7XXXXXXXX",
    cities: [
      { value: "amman", ar: "عمّان", en: "Amman" },
      { value: "irbid", ar: "إربد", en: "Irbid" },
      { value: "aqaba", ar: "العقبة", en: "Aqaba" },
      { value: "other", ar: "مدينة أخرى", en: "Other city" },
    ],
  },
  {
    code: "LB",
    dialCode: "+961",
    ar: "لبنان",
    en: "Lebanon",
    phoneExample: "XXXXXXXX",
    cities: [
      { value: "beirut", ar: "بيروت", en: "Beirut" },
      { value: "tripoli_lb", ar: "طرابلس", en: "Tripoli" },
      { value: "other", ar: "مدينة أخرى", en: "Other city" },
    ],
  },
  {
    code: "US",
    dialCode: "+1",
    ar: "الولايات المتحدة",
    en: "United States",
    phoneExample: "XXXXXXXXXX",
    cities: [
      { value: "los_angeles", ar: "لوس أنجلوس", en: "Los Angeles" },
      { value: "new_york", ar: "نيويورك", en: "New York" },
      { value: "other", ar: "مدينة أخرى", en: "Other city" },
    ],
  },
  {
    code: "GB",
    dialCode: "+44",
    ar: "المملكة المتحدة",
    en: "United Kingdom",
    phoneExample: "7XXXXXXXXX",
    cities: [
      { value: "london", ar: "لندن", en: "London" },
      { value: "manchester", ar: "مانشستر", en: "Manchester" },
      { value: "other", ar: "مدينة أخرى", en: "Other city" },
    ],
  },
];

export const NATIONALITY_OPTIONS = NATIONALITIES.map((item) => ({
  value: item.slug,
  ar: item.ar,
  en: item.en,
  countryAr: item.countryAr,
  countryEn: item.countryEn,
})) as readonly {
  value: string;
  ar: string;
  en: string;
  countryAr: string;
  countryEn: string;
}[];

export const GENDER_OPTIONS = [
  { value: "male", ar: "ذكر", en: "Male" },
  { value: "female", ar: "أنثى", en: "Female" },
  { value: "other", ar: "أخرى", en: "Other" },
  { value: "prefer_not_to_say", ar: "أفضل عدم الإفصاح", en: "Prefer not to say" },
] as const;

/**
 * New MLAMH registrations intentionally collect only the two operational
 * gender values used by casting filters. Keep GENDER_OPTIONS above intact for
 * read/edit compatibility with legacy accounts that may already store older
 * values.
 */
export const SIGNUP_GENDER_OPTIONS = GENDER_OPTIONS.filter(
  (item) => item.value === "male" || item.value === "female",
);

export function getGenderOptionsForSelection(currentValue?: string | null) {
  const current = GENDER_OPTIONS.find((item) => item.value === currentValue);
  if (!current || SIGNUP_GENDER_OPTIONS.some((item) => item.value === current.value)) {
    return SIGNUP_GENDER_OPTIONS;
  }
  return [...SIGNUP_GENDER_OPTIONS, current];
}

export const PROFILE_VISIBILITY_OPTIONS = [
  {
    value: "public",
    ar: "ملف عام بعد الاعتماد",
    en: "Public after approval",
    descriptionAr: "يمكن عرض ملفك المهني وصورك ومعلوماتك الأساسية في دليل مواهب ملامح بعد الاعتماد.",
    descriptionEn: "Your professional profile, photos and core details may appear in the MLAMH talent directory after approval.",
  },
  {
    value: "private",
    ar: "ملفي خاص",
    en: "Keep my profile private",
    descriptionAr: "لن يظهر ملفك للعامة. يبقى داخل قاعدة ملامح للمطابقة الخاصة مع الفرص والطلبات المناسبة.",
    descriptionEn: "Your profile will not appear publicly. It remains in MLAMH for private matching with relevant opportunities and Briefs.",
  },
] as const;