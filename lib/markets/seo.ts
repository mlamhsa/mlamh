import { isMarketFeatureEnabled } from "./config.ts";
import { COUNTRY_CODES, type CountryCode } from "./countries.ts";

export function canIndexMarket(countryCode: CountryCode): boolean {
  return isMarketFeatureEnabled(countryCode, "seoIndexing");
}

export function getIndexableMarkets(): CountryCode[] {
  return COUNTRY_CODES.filter(canIndexMarket);
}
