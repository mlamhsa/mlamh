export const COUNTRY_CODES = [
  "SA",
  "AE",
  "EG",
  "MA",
  "QA",
  "JO",
  "LB",
  "KW",
] as const;

export type CountryCode = (typeof COUNTRY_CODES)[number];

export type CountryDefinition = {
  code: CountryCode;
  nameAr: string;
  nameEn: string;
  defaultCurrency: string;
};

export const COUNTRY_REGISTRY: Record<CountryCode, CountryDefinition> = {
  SA: { code: "SA", nameAr: "السعودية", nameEn: "Saudi Arabia", defaultCurrency: "SAR" },
  AE: { code: "AE", nameAr: "الإمارات", nameEn: "United Arab Emirates", defaultCurrency: "AED" },
  EG: { code: "EG", nameAr: "مصر", nameEn: "Egypt", defaultCurrency: "EGP" },
  MA: { code: "MA", nameAr: "المغرب", nameEn: "Morocco", defaultCurrency: "MAD" },
  QA: { code: "QA", nameAr: "قطر", nameEn: "Qatar", defaultCurrency: "QAR" },
  JO: { code: "JO", nameAr: "الأردن", nameEn: "Jordan", defaultCurrency: "JOD" },
  LB: { code: "LB", nameAr: "لبنان", nameEn: "Lebanon", defaultCurrency: "LBP" },
  KW: { code: "KW", nameAr: "الكويت", nameEn: "Kuwait", defaultCurrency: "KWD" },
};

export function isCountryCode(value: string): value is CountryCode {
  return COUNTRY_CODES.includes(value as CountryCode);
}
