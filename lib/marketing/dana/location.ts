import type { CountryCode } from "../../markets/countries.ts";

export type ParsedLocation = {
  countryCode: CountryCode | null;
  city: string | null;
};

const LOCATION_ALIASES: Array<{
  countryCode: CountryCode;
  city: string;
  aliases: string[];
}> = [
  { countryCode: "SA", city: "Jeddah", aliases: ["جدة", "jeddah"] },
  { countryCode: "SA", city: "Riyadh", aliases: ["الرياض", "riyadh"] },
  { countryCode: "SA", city: "Dammam", aliases: ["الدمام", "dammam"] },
  { countryCode: "SA", city: "Khobar", aliases: ["الخبر", "khobar"] },
  { countryCode: "SA", city: "Makkah", aliases: ["مكة", "makkah", "mecca"] },
  { countryCode: "SA", city: "Madinah", aliases: ["المدينة", "madinah", "medina"] },
  { countryCode: "AE", city: "Dubai", aliases: ["دبي", "dubai"] },
  { countryCode: "AE", city: "Abu Dhabi", aliases: ["أبوظبي", "ابوظبي", "abu dhabi"] },
  { countryCode: "EG", city: "Cairo", aliases: ["القاهرة", "cairo"] },
  { countryCode: "EG", city: "Alexandria", aliases: ["الإسكندرية", "الاسكندرية", "alexandria"] },
  { countryCode: "MA", city: "Casablanca", aliases: ["الدار البيضاء", "كازابلانكا", "casablanca"] },
  { countryCode: "MA", city: "Rabat", aliases: ["الرباط", "rabat"] },
  { countryCode: "QA", city: "Doha", aliases: ["الدوحة", "doha"] },
];

const COUNTRY_ALIASES: Array<[CountryCode, string[]]> = [
  ["SA", ["السعودية", "السعوديه", "saudi arabia", "ksa"]],
  ["AE", ["الإمارات", "الامارات", "united arab emirates", "uae"]],
  ["EG", ["مصر", "egypt"]],
  ["MA", ["المغرب", "morocco"]],
  ["QA", ["قطر", "qatar"]],
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[^\p{L}\p{N}+]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function parseDanaLocation(value: string): ParsedLocation {
  const text = normalize(value);
  const cityMatch = LOCATION_ALIASES.find(({ aliases }) =>
    aliases.some((alias) => text.includes(normalize(alias))),
  );
  if (cityMatch) {
    return { countryCode: cityMatch.countryCode, city: cityMatch.city };
  }

  const countryMatch = COUNTRY_ALIASES.find(([, aliases]) =>
    aliases.some((alias) => text.includes(normalize(alias))),
  );
  return {
    countryCode: countryMatch?.[0] ?? null,
    city: null,
  };
}

export function normalizeInternationalPhone(
  value?: string | null,
  countryHint?: CountryCode | null,
) {
  const raw = (value ?? "").trim();
  if (!raw) return "";

  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00") && digits.length > 4) return `+${digits.slice(2)}`;
  if (raw.startsWith("+")) return `+${digits}`;

  const dialingCode: Partial<Record<CountryCode, string>> = {
    SA: "966",
    AE: "971",
    EG: "20",
    MA: "212",
    QA: "974",
  };
  const code = countryHint ? dialingCode[countryHint] : undefined;
  if (code) {
    if (digits.startsWith(code)) return `+${digits}`;
    if (digits.startsWith("0")) return `+${code}${digits.slice(1)}`;
  }

  // Preserve the current Saudi legacy behavior only for unhinted 05 mobile numbers.
  if (!countryHint && digits.startsWith("05") && digits.length === 10) {
    return `+966${digits.slice(1)}`;
  }

  // Do not guess a country for otherwise ambiguous local numbers.
  return digits;
}
