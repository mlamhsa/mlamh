import { SAUDI_CITY_OPTIONS } from "@/lib/profile-options";

export type CanonicalMobileOption = { value: string; ar: string; en: string; code?: string };
export type MobileProfileOptionsResponse = { cities: CanonicalMobileOption[]; nationalities: CanonicalMobileOption[] };

export const FALLBACK_NATIONALITY_OPTIONS: CanonicalMobileOption[] = [
  { value: "saudi", ar: "سعودي", en: "Saudi" },
  { value: "emirati", ar: "إماراتي", en: "Emirati" },
  { value: "kuwaiti", ar: "كويتي", en: "Kuwaiti" },
  { value: "qatari", ar: "قطري", en: "Qatari" },
  { value: "bahraini", ar: "بحريني", en: "Bahraini" },
  { value: "omani", ar: "عُماني", en: "Omani" },
  { value: "yemeni", ar: "يمني", en: "Yemeni" },
  { value: "iraqi", ar: "عراقي", en: "Iraqi" },
  { value: "jordanian", ar: "أردني", en: "Jordanian" },
  { value: "palestinian", ar: "فلسطيني", en: "Palestinian" },
  { value: "lebanese", ar: "لبناني", en: "Lebanese" },
  { value: "syrian", ar: "سوري", en: "Syrian" },
  { value: "egyptian", ar: "مصري", en: "Egyptian" },
  { value: "sudanese", ar: "سوداني", en: "Sudanese" },
  { value: "libyan", ar: "ليبي", en: "Libyan" },
  { value: "tunisian", ar: "تونسي", en: "Tunisian" },
  { value: "algerian", ar: "جزائري", en: "Algerian" },
  { value: "moroccan", ar: "مغربي", en: "Moroccan" },
  { value: "mauritanian", ar: "موريتاني", en: "Mauritanian" },
  { value: "somali", ar: "صومالي", en: "Somali" },
  { value: "djiboutian", ar: "جيبوتي", en: "Djiboutian" },
  { value: "comorian", ar: "قمري", en: "Comorian" },
  { value: "turkish", ar: "تركي", en: "Turkish" },
  { value: "iranian", ar: "إيراني", en: "Iranian" },
  { value: "afghan", ar: "أفغاني", en: "Afghan" },
  { value: "pakistani", ar: "باكستاني", en: "Pakistani" },
  { value: "indian", ar: "هندي", en: "Indian" },
  { value: "bangladeshi", ar: "بنغلاديشي", en: "Bangladeshi" },
  { value: "sri-lankan", ar: "سريلانكي", en: "Sri Lankan" },
  { value: "nepali", ar: "نيبالي", en: "Nepali" },
  { value: "filipino", ar: "فلبيني", en: "Filipino" },
  { value: "indonesian", ar: "إندونيسي", en: "Indonesian" },
  { value: "malaysian", ar: "ماليزي", en: "Malaysian" },
  { value: "singaporean", ar: "سنغافوري", en: "Singaporean" },
  { value: "thai", ar: "تايلندي", en: "Thai" },
  { value: "vietnamese", ar: "فيتنامي", en: "Vietnamese" },
  { value: "chinese", ar: "صيني", en: "Chinese" },
  { value: "japanese", ar: "ياباني", en: "Japanese" },
  { value: "south-korean", ar: "كوري جنوبي", en: "South Korean" },
  { value: "kazakh", ar: "كازاخستاني", en: "Kazakh" },
  { value: "uzbek", ar: "أوزبكي", en: "Uzbek" },
  { value: "russian", ar: "روسي", en: "Russian" },
  { value: "ukrainian", ar: "أوكراني", en: "Ukrainian" },
  { value: "british", ar: "بريطاني", en: "British" },
  { value: "irish", ar: "أيرلندي", en: "Irish" },
  { value: "french", ar: "فرنسي", en: "French" },
  { value: "german", ar: "ألماني", en: "German" },
  { value: "italian", ar: "إيطالي", en: "Italian" },
  { value: "spanish", ar: "إسباني", en: "Spanish" },
  { value: "portuguese", ar: "برتغالي", en: "Portuguese" },
  { value: "dutch", ar: "هولندي", en: "Dutch" },
  { value: "belgian", ar: "بلجيكي", en: "Belgian" },
  { value: "swiss", ar: "سويسري", en: "Swiss" },
  { value: "austrian", ar: "نمساوي", en: "Austrian" },
  { value: "swedish", ar: "سويدي", en: "Swedish" },
  { value: "norwegian", ar: "نرويجي", en: "Norwegian" },
  { value: "danish", ar: "دنماركي", en: "Danish" },
  { value: "finnish", ar: "فنلندي", en: "Finnish" },
  { value: "polish", ar: "بولندي", en: "Polish" },
  { value: "greek", ar: "يوناني", en: "Greek" },
  { value: "romanian", ar: "روماني", en: "Romanian" },
  { value: "american", ar: "أمريكي", en: "American" },
  { value: "canadian", ar: "كندي", en: "Canadian" },
  { value: "mexican", ar: "مكسيكي", en: "Mexican" },
  { value: "brazilian", ar: "برازيلي", en: "Brazilian" },
  { value: "argentinian", ar: "أرجنتيني", en: "Argentinian" },
  { value: "colombian", ar: "كولومبي", en: "Colombian" },
  { value: "venezuelan", ar: "فنزويلي", en: "Venezuelan" },
  { value: "chilean", ar: "تشيلي", en: "Chilean" },
  { value: "peruvian", ar: "بيروفي", en: "Peruvian" },
  { value: "south-african", ar: "جنوب أفريقي", en: "South African" },
  { value: "ethiopian", ar: "إثيوبي", en: "Ethiopian" },
  { value: "eritrean", ar: "إريتري", en: "Eritrean" },
  { value: "kenyan", ar: "كيني", en: "Kenyan" },
  { value: "nigerian", ar: "نيجيري", en: "Nigerian" },
  { value: "ghanaian", ar: "غاني", en: "Ghanaian" },
  { value: "senegalese", ar: "سنغالي", en: "Senegalese" },
  { value: "australian", ar: "أسترالي", en: "Australian" },
  { value: "new-zealander", ar: "نيوزيلندي", en: "New Zealander" },
];

const FALLBACK_OPTIONS: MobileProfileOptionsResponse = {
  cities: SAUDI_CITY_OPTIONS.map(({ value, ar, en }) => ({ value, ar, en })),
  nationalities: FALLBACK_NATIONALITY_OPTIONS,
};

function requireApiBaseUrl() {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (!configured) throw new Error("Missing EXPO_PUBLIC_API_BASE_URL for this mobile environment.");
  let parsed: URL;
  try { parsed = new URL(configured); } catch { throw new Error("Invalid EXPO_PUBLIC_API_BASE_URL for this mobile environment."); }
  if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && ["localhost", "127.0.0.1"].includes(parsed.hostname))) throw new Error("EXPO_PUBLIC_API_BASE_URL must use HTTPS except for localhost development.");
  return configured.replace(/\/$/, "");
}

const API_BASE_URL = requireApiBaseUrl();

function isOption(value: unknown): value is CanonicalMobileOption {
  if (!value || typeof value !== "object") return false;
  const option = value as Partial<CanonicalMobileOption>;
  return typeof option.value === "string" && option.value.trim().length > 0 && typeof option.ar === "string" && option.ar.trim().length > 0 && typeof option.en === "string" && option.en.trim().length > 0 && (option.code === undefined || typeof option.code === "string");
}

function normalizeOptions(values: unknown) {
  if (!Array.isArray(values)) return null;
  const normalized = values.filter(isOption).map((option) => ({ value: option.value.trim(), ar: option.ar.trim(), en: option.en.trim(), ...(option.code ? { code: option.code.trim().toUpperCase() } : {}) }));
  if (normalized.length !== values.length) return null;
  const unique = new Map(normalized.map((option) => [option.value, option]));
  return [...unique.values()];
}

export async function getCanonicalProfileOptions(): Promise<MobileProfileOptionsResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/mobile/profile-options`, { headers: { Accept: "application/json" } });
    if (!response.ok) return FALLBACK_OPTIONS;
    const raw = await response.text().catch(() => "");
    if (!raw) return FALLBACK_OPTIONS;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return FALLBACK_OPTIONS;
    const payload = parsed as { cities?: unknown; nationalities?: unknown };
    const cities = normalizeOptions(payload.cities);
    const nationalities = normalizeOptions(payload.nationalities);
    if (!cities || !nationalities || cities.length === 0 || nationalities.length === 0) return FALLBACK_OPTIONS;
    return { cities, nationalities };
  } catch { return FALLBACK_OPTIONS; }
}
