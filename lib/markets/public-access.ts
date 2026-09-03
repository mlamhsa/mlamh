import { isMarketFeatureEnabled, type MarketFeature } from "./config.ts";
import type { CountryCode } from "./countries.ts";

export type PublicOpportunityMarketRecord = {
  country_code?: CountryCode | null;
};

export type PublicTalentMarketRecord = {
  base_country_code?: CountryCode | null;
};

export function resolveLegacyOpportunityCountry(
  record: PublicOpportunityMarketRecord,
): CountryCode {
  return record.country_code ?? "SA";
}

export function resolveLegacyTalentBaseCountry(
  record: PublicTalentMarketRecord,
): CountryCode {
  return record.base_country_code ?? "SA";
}

export function canExposePublicMarket(
  countryCode: CountryCode,
  feature: Extract<MarketFeature, "publicTalentDirectory" | "publicOpportunities">,
): boolean {
  return isMarketFeatureEnabled(countryCode, feature);
}

export function opportunityBelongsToPublicMarket(
  record: PublicOpportunityMarketRecord,
  countryCode: CountryCode,
): boolean {
  return resolveLegacyOpportunityCountry(record) === countryCode;
}

export function talentBelongsToPublicMarket(
  record: PublicTalentMarketRecord,
  countryCode: CountryCode,
): boolean {
  return resolveLegacyTalentBaseCountry(record) === countryCode;
}

export function canExposePublicRecord(
  record: PublicOpportunityMarketRecord,
  countryCode: CountryCode,
  feature: "publicOpportunities",
): boolean {
  return canExposePublicMarket(countryCode, feature) &&
    opportunityBelongsToPublicMarket(record, countryCode);
}

export function canExposePublicTalent(
  record: PublicTalentMarketRecord,
  countryCode: CountryCode,
): boolean {
  return canExposePublicMarket(countryCode, "publicTalentDirectory") &&
    talentBelongsToPublicMarket(record, countryCode);
}
