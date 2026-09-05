import type { AppLocale } from "@/lib/i18n";

const MARKET_LABELS = {
  SA: { ar: "السعودية", en: "Saudi Arabia", currency: "SAR" },
  AE: { ar: "الإمارات", en: "United Arab Emirates", currency: "AED" },
  EG: { ar: "مصر", en: "Egypt", currency: "EGP" },
  MA: { ar: "المغرب", en: "Morocco", currency: "MAD" },
  QA: { ar: "قطر", en: "Qatar", currency: "QAR" },
  JO: { ar: "الأردن", en: "Jordan", currency: "JOD" },
  LB: { ar: "لبنان", en: "Lebanon", currency: "LBP" },
  KW: { ar: "الكويت", en: "Kuwait", currency: "KWD" },
} as const;

export type KnownMobileMarket = keyof typeof MARKET_LABELS;

export function getMobileMarketLabel(countryCode: string | null | undefined, locale: AppLocale) {
  const code = countryCode?.trim().toUpperCase();
  if (!code) return null;
  const market = MARKET_LABELS[code as KnownMobileMarket];
  return market ? market[locale] : code;
}

export function getMobileMarketCurrency(countryCode: string | null | undefined) {
  const code = countryCode?.trim().toUpperCase();
  if (!code) return null;
  return MARKET_LABELS[code as KnownMobileMarket]?.currency ?? null;
}
