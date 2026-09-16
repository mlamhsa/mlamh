export type MarketCode = "SA" | "AE" | "QA" | "MA";

export type MarketConfig = {
  code: MarketCode;
  enabled: boolean;
  currency: string;
  phoneCountryCode: string;
  defaultLocale: "ar" | "en";
};

export const markets: Record<MarketCode, MarketConfig> = {
  SA: {
    code: "SA",
    enabled: true,
    currency: "SAR",
    phoneCountryCode: "+966",
    defaultLocale: "ar",
  },
  AE: {
    code: "AE",
    enabled: false,
    currency: "AED",
    phoneCountryCode: "+971",
    defaultLocale: "ar",
  },
  QA: {
    code: "QA",
    enabled: false,
    currency: "QAR",
    phoneCountryCode: "+974",
    defaultLocale: "ar",
  },
  MA: {
    code: "MA",
    enabled: false,
    currency: "MAD",
    phoneCountryCode: "+212",
    defaultLocale: "ar",
  },
};

export function getMarketConfig(code: string | null | undefined) {
  const normalized = String(code ?? "SA").trim().toUpperCase() as MarketCode;
  return markets[normalized] ?? markets.SA;
}
