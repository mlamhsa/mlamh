import { isMarketFeatureEnabled } from "./config.ts";
import type { CountryCode } from "./countries.ts";

export function canIndexMarket(countryCode: CountryCode): boolean {
  return isMarketFeatureEnabled(countryCode, "seoIndexing");
}

export function getIndexableMarkets(): CountryCode[] {
  const markets: CountryCode[] = ["SA", "AE", "EG", "MA", "QA", "JO", "LB", "KW"];
  return markets.filter(canIndexMarket);
}
