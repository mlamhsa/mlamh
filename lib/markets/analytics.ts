import type { CountryCode } from "./countries.ts";

export type MarketScopedRecord = {
  country_code?: CountryCode | null;
};

export type TalentMarketScopedRecord = {
  base_country_code?: CountryCode | null;
};

export type MarketAnalyticsInput = {
  talents: TalentMarketScopedRecord[];
  publishers: MarketScopedRecord[];
  opportunities: MarketScopedRecord[];
  applications: Array<{
    opportunity_country_code?: CountryCode | null;
  }>;
  acceptedApplications: Array<{
    opportunity_country_code?: CountryCode | null;
  }>;
  connections: Array<{
    opportunity_country_code?: CountryCode | null;
  }>;
};

export type MarketAnalyticsSnapshot = {
  countryCode: CountryCode;
  talents: number;
  publishers: number;
  opportunities: number;
  applications: number;
  acceptedApplications: number;
  connections: number;
  applicationAcceptanceRate: number;
  opportunityConnectionRate: number;
};

function legacyCountry(value?: CountryCode | null): CountryCode {
  return value ?? "SA";
}

function rate(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

export function buildMarketAnalyticsSnapshot(
  countryCode: CountryCode,
  input: MarketAnalyticsInput,
): MarketAnalyticsSnapshot {
  const talents = input.talents.filter(
    (record) => legacyCountry(record.base_country_code) === countryCode,
  ).length;
  const publishers = input.publishers.filter(
    (record) => legacyCountry(record.country_code) === countryCode,
  ).length;
  const opportunities = input.opportunities.filter(
    (record) => legacyCountry(record.country_code) === countryCode,
  ).length;
  const applications = input.applications.filter(
    (record) => legacyCountry(record.opportunity_country_code) === countryCode,
  ).length;
  const acceptedApplications = input.acceptedApplications.filter(
    (record) => legacyCountry(record.opportunity_country_code) === countryCode,
  ).length;
  const connections = input.connections.filter(
    (record) => legacyCountry(record.opportunity_country_code) === countryCode,
  ).length;

  return {
    countryCode,
    talents,
    publishers,
    opportunities,
    applications,
    acceptedApplications,
    connections,
    applicationAcceptanceRate: rate(acceptedApplications, applications),
    opportunityConnectionRate: rate(connections, opportunities),
  };
}
