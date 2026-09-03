import { isMarketFeatureEnabled, type MarketFeature } from "./config.ts";
import type { CountryCode } from "./countries.ts";

export type PublicMarketTaggedRecord = {
  country_code?: CountryCode | null;
};

export function resolveLegacyRecordCountry(
  record: PublicMarketTaggedRecord,
): CountryCode {
  return record.country_code ?? "SA";
}

export function canExposePublicMarket(
  countryCode: CountryCode,
  feature: Extract<MarketFeature, "publicTalentDirectory" | "publicOpportunities">,
): boolean {
  return isMarketFeatureEnabled(countryCode, feature);
}

export function recordBelongsToPublicMarket(
  record: PublicMarketTaggedRecord,
  countryCode: CountryCode,
): boolean {
  return resolveLegacyRecordCountry(record) === countryCode;
}

export function canExposePublicRecord(
  record: PublicMarketTaggedRecord,
  countryCode: CountryCode,
  feature: Extract<MarketFeature, "publicTalentDirectory" | "publicOpportunities">,
): boolean {
  return canExposePublicMarket(countryCode, feature) &&
    recordBelongsToPublicMarket(record, countryCode);
}
