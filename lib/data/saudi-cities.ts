export type SaudiCity = {
  slug: string;
  ar: string;
  en: string;
  regionId: number;
};

/**
 * Saudi cities used by MLAMH registration and profile filters.
 *
 * The list is intentionally city-focused (108 cities) rather than every village,
 * centre, or locality in the National Address gazetteer. It is based on the
 * Saudi National Address city dataset and excludes the old catch-all "other"
 * option so every new profile stores a real city.
 */
export const SAUDI_CITIES: readonly SaudiCity[] = [
  // Riyadh Region
  { slug: "riyadh", ar: "الرياض", en: "Riyadh", regionId: 1 },
  { slug: "al-majmaah", ar: "المجمعة", en: "Al Majma'ah", regionId: 1 },
  { slug: "harmah", ar: "حرمة", en: "Harmah", regionId: 1 },
  { slug: "tumair", ar: "تمير", en: "Tumair", regionId: 1 },
  { slug: "az-zulfi", ar: "الزلفي", en: "Az Zulfi", regionId: 1 },
  { slug: "al-ghat", ar: "الغاط", en: "Al Ghat", regionId: 1 },
  { slug: "afif", ar: "عفيف", en: "Afif", regionId: 1 },
  { slug: "thadiq", ar: "ثادق", en: "Thadiq", regionId: 1 },
  { slug: "shaqra", ar: "شقراء", en: "Shaqra'", regionId: 1 },
  { slug: "ad-duwadimi", ar: "الدوادمي", en: "Ad Duwadimi", regionId: 1 },
  { slug: "huraymila", ar: "حريملاء", en: "Huraymila", regionId: 1 },
  { slug: "ad-diriyah", ar: "الدرعية", en: "Ad Dir'iyah", regionId: 1 },
  { slug: "duruma", ar: "ضرما", en: "Duruma", regionId: 1 },
  { slug: "al-quwayiyah", ar: "القويعية", en: "Al Quway'iyah", regionId: 1 },
  { slug: "al-muzahimiyah", ar: "المزاحمية", en: "Al Muzahimiyah", regionId: 1 },
  { slug: "al-kharj", ar: "الخرج", en: "Al Kharj", regionId: 1 },
  { slug: "ad-dilam", ar: "الدلم", en: "Ad Dilam", regionId: 1 },
  { slug: "as-sulayyil", ar: "السليل", en: "As Sulayyil", regionId: 1 },
  { slug: "al-hariq", ar: "الحريق", en: "Al Hariq", regionId: 1 },
  { slug: "hawtat-bani-tamim", ar: "حوطة بني تميم", en: "Hawtat Bani Tamim", regionId: 1 },
  { slug: "layla", ar: "ليلى", en: "Layla", regionId: 1 },

  // Makkah Region
  { slug: "taif", ar: "الطائف", en: "At Taif", regionId: 2 },
  { slug: "makkah", ar: "مكة المكرمة", en: "Makkah", regionId: 2 },
  { slug: "jeddah", ar: "جدة", en: "Jeddah", regionId: 2 },
  { slug: "rabigh", ar: "رابغ", en: "Rabigh", regionId: 2 },
  { slug: "khulays", ar: "خليص", en: "Khulays", regionId: 2 },
  { slug: "al-khurmah", ar: "الخرمة", en: "Al Khurmah", regionId: 2 },
  { slug: "al-jumum", ar: "الجموم", en: "Al Jumum", regionId: 2 },
  { slug: "al-qunfudhah", ar: "القنفذة", en: "Al Qunfidhah", regionId: 2 },
  { slug: "thuwal", ar: "ثول", en: "Thuwal", regionId: 2 },
  { slug: "turbah", ar: "تربة", en: "Turbah", regionId: 2 },
  { slug: "king-abdullah-economic-city", ar: "مدينة الملك عبدالله الاقتصادية", en: "King Abdullah Economic City", regionId: 2 },

  // Madinah Region
  { slug: "madinah", ar: "المدينة المنورة", en: "Madinah", regionId: 3 },
  { slug: "al-ula", ar: "العلا", en: "Al Ula", regionId: 3 },
  { slug: "khaybar", ar: "خيبر", en: "Khaybar", regionId: 3 },
  { slug: "yanbu", ar: "ينبع", en: "Yanbu", regionId: 3 },
  { slug: "badr", ar: "بدر", en: "Badr", regionId: 3 },
  { slug: "yanbu-industrial", ar: "ينبع الصناعية", en: "Yanbu Industrial City", regionId: 3 },

  // Qassim Region
  { slug: "buraydah", ar: "بريدة", en: "Buraydah", regionId: 4 },
  { slug: "unayzah", ar: "عنيزة", en: "Unayzah", regionId: 4 },
  { slug: "uyun-al-jawa", ar: "عيون الجواء", en: "Uyun Al Jawa'", regionId: 4 },
  { slug: "ar-rass", ar: "الرس", en: "Ar Rass", regionId: 4 },
  { slug: "al-midhnab", ar: "المذنب", en: "Al Midhnab", regionId: 4 },
  { slug: "riyad-al-khabra", ar: "رياض الخبراء", en: "Riyad Al Khabra", regionId: 4 },
  { slug: "al-badai", ar: "البدائع", en: "Al Badai'", regionId: 4 },
  { slug: "al-hilaliyah", ar: "الهلالية", en: "Al Hilaliyah", regionId: 4 },
  { slug: "al-bukayriyah", ar: "البكيرية", en: "Al Bukayriyah", regionId: 4 },
  { slug: "ash-shimasiyah", ar: "الشماسية", en: "Ash Shimasiyah", regionId: 4 },
  { slug: "an-nabhaniyah", ar: "النبهانية", en: "An Nabhaniyah", regionId: 4 },
  { slug: "al-marmuthah", ar: "المرموثة", en: "Al Marmuthah", regionId: 4 },

  // Eastern Province
  { slug: "al-hufuf", ar: "الهفوف", en: "Al Hufuf", regionId: 5 },
  { slug: "dammam", ar: "الدمام", en: "Dammam", regionId: 5 },
  { slug: "khobar", ar: "الخبر", en: "Al Khobar", regionId: 5 },
  { slug: "hafar-al-batin", ar: "حفر الباطن", en: "Hafar Al Batin", regionId: 5 },
  { slug: "al-qatif", ar: "القطيف", en: "Al Qatif", regionId: 5 },
  { slug: "qaryat-al-ulya", ar: "قرية العليا", en: "Qaryat Al 'Ulya", regionId: 5 },
  { slug: "jubail", ar: "الجبيل", en: "Al Jubail", regionId: 5 },
  { slug: "an-nuayriyah", ar: "النعيرية", en: "An Nu'ayriyah", regionId: 5 },
  { slug: "dhahran", ar: "الظهران", en: "Dhahran", regionId: 5 },
  { slug: "buqayq", ar: "بقيق", en: "Buqayq", regionId: 5 },
  { slug: "sayhat", ar: "سيهات", en: "Sayhat", regionId: 5 },
  { slug: "tarut", ar: "تاروت", en: "Tarut", regionId: 5 },
  { slug: "safwa", ar: "صفوى", en: "Safwa", regionId: 5 },
  { slug: "inak", ar: "عنك", en: "Inak", regionId: 5 },
  { slug: "darin", ar: "دارين", en: "Darin", regionId: 5 },
  { slug: "al-khafji", ar: "الخفجي", en: "Al Khafji", regionId: 5 },
  { slug: "ras-tannurah", ar: "رأس تنورة", en: "Ras Tannurah", regionId: 5 },
  { slug: "al-mubarraz", ar: "المبرز", en: "Al Mubarraz", regionId: 5 },
  { slug: "al-ahsa", ar: "الأحساء", en: "Al Ahsa", regionId: 5 },

  // Asir Region
  { slug: "abha", ar: "أبها", en: "Abha", regionId: 6 },
  { slug: "khamis-mushait", ar: "خميس مشيط", en: "Khamis Mushait", regionId: 6 },
  { slug: "ahad-rifaydah", ar: "أحد رفيدة", en: "Ahad Rifaydah", regionId: 6 },
  { slug: "tarib", ar: "طريب", en: "Tarib", regionId: 6 },
  { slug: "al-majardah", ar: "المجاردة", en: "Al Majardah", regionId: 6 },
  { slug: "tathlith", ar: "تثليث", en: "Tathlith", regionId: 6 },
  { slug: "bishah", ar: "بيشة", en: "Bishah", regionId: 6 },
  { slug: "sabt-al-alayah", ar: "سبت العلاية", en: "Sabt Al 'Alayah", regionId: 6 },
  { slug: "muhayil", ar: "محايل", en: "Muhayil", regionId: 6 },
  { slug: "an-namas", ar: "النماص", en: "An Namas", regionId: 6 },
  { slug: "billasmar", ar: "بللسمر", en: "Billasmar", regionId: 6 },
  { slug: "sarat-abidah", ar: "سراة عبيدة", en: "Sarat Abidah", regionId: 6 },
  { slug: "tendaha", ar: "تندحة", en: "Tendaha", regionId: 6 },

  // Tabuk Region
  { slug: "tabuk", ar: "تبوك", en: "Tabuk", regionId: 7 },
  { slug: "haql", ar: "حقل", en: "Haql", regionId: 7 },
  { slug: "tayma", ar: "تيماء", en: "Tayma'", regionId: 7 },
  { slug: "al-wajh", ar: "الوجه", en: "Al Wajh", regionId: 7 },
  { slug: "umluj", ar: "أملج", en: "Umluj", regionId: 7 },
  { slug: "duba", ar: "ضبا", en: "Duba", regionId: 7 },

  // Hail Region
  { slug: "hail", ar: "حائل", en: "Hail", regionId: 8 },
  { slug: "ash-shinan", ar: "الشنان", en: "Ash Shinan", regionId: 8 },

  // Northern Borders Region
  { slug: "turaif", ar: "طريف", en: "Turaif", regionId: 9 },
  { slug: "arar", ar: "عرعر", en: "Arar", regionId: 9 },
  { slug: "rafha", ar: "رفحاء", en: "Rafha'", regionId: 9 },

  // Jazan Region
  { slug: "jazan", ar: "جازان", en: "Jazan", regionId: 10 },
  { slug: "sabya", ar: "صبيا", en: "Sabya", regionId: 10 },
  { slug: "abu-arish", ar: "أبو عريش", en: "Abu Arish", regionId: 10 },
  { slug: "samtah", ar: "صامطة", en: "Samtah", regionId: 10 },
  { slug: "al-aridah", ar: "العارضة", en: "Al 'Aridah", regionId: 10 },
  { slug: "ahad-al-musarihah", ar: "أحد المسارحة", en: "Ahad Al Musarihah", regionId: 10 },

  // Najran Region
  { slug: "yadamah", ar: "يدمة", en: "Yadamah", regionId: 11 },
  { slug: "sharurah", ar: "شرورة", en: "Sharurah", regionId: 11 },
  { slug: "najran", ar: "نجران", en: "Najran", regionId: 11 },

  // Al Baha Region
  { slug: "al-baha", ar: "الباحة", en: "Al Baha", regionId: 12 },

  // Al Jawf Region
  { slug: "al-qurayyat", ar: "القريات", en: "Al Qurayyat", regionId: 13 },
  { slug: "suwayr", ar: "صوير", en: "Suwayr", regionId: 13 },
  { slug: "sakaka", ar: "سكاكا", en: "Sakaka", regionId: 13 },
  { slug: "dawmat-al-jandal", ar: "دومة الجندل", en: "Dawmat Al Jandal", regionId: 13 },
  { slug: "al-adari", ar: "الأضارع", en: "Al Adari'", regionId: 13 },
] as const;

export type SaudiCitySlug = (typeof SAUDI_CITIES)[number]["slug"];

const LEGACY_SLUG_ALIASES: Record<string, string> = {
  "khamis_mushait": "khamis-mushait",
  "al_ahsa": "al-ahsa",
  "al_muzahimiyah": "al-muzahimiyah",
  "buraidah": "buraydah",
};

export function normalizeSaudiCitySlug(value?: string | null) {
  const slug = String(value ?? "").trim().toLowerCase();
  if (!slug || slug === "other") return "";
  return LEGACY_SLUG_ALIASES[slug] ?? slug;
}

export function normalizeSaudiCitySearchText(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/[’']/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function getSaudiCityBySlug(slug?: string | null) {
  const normalized = normalizeSaudiCitySlug(slug);
  if (!normalized) return null;
  return SAUDI_CITIES.find((city) => city.slug === normalized) ?? null;
}

export function findSaudiCity(value?: string | null) {
  const direct = getSaudiCityBySlug(value);
  if (direct) return direct;

  const normalized = normalizeSaudiCitySearchText(value);
  if (!normalized) return null;

  return SAUDI_CITIES.find((city) =>
    [city.slug, city.ar, city.en].some(
      (candidate) => normalizeSaudiCitySearchText(candidate) === normalized,
    ),
  ) ?? null;
}

export function matchesSaudiCitySearch(city: SaudiCity, query?: string | null) {
  const needle = normalizeSaudiCitySearchText(query);
  if (!needle) return true;
  return normalizeSaudiCitySearchText(`${city.ar} ${city.en} ${city.slug}`).includes(needle);
}

export function getSaudiCityLabel(slug: string | null | undefined, locale: "ar" | "en") {
  const city = getSaudiCityBySlug(slug);
  if (!city) return "";
  return locale === "ar" ? city.ar : city.en;
}
