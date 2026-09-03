import type { CountryCode } from "./countries.ts";

export type TalentMarketContext = {
  baseCountryCode?: CountryCode | null;
  workMarketCodes?: CountryCode[] | null;
};

export type MarketEligibility = {
  eligible: boolean;
  reason: "base_market" | "work_market" | "legacy_sa" | "market_mismatch";
};

/**
 * Market eligibility is intentionally separate from nationality and city matching.
 * Legacy talents without country data are treated as Saudi only while Saudi is the
 * sole active market. They are never implicitly eligible for another country.
 */
export function evaluateTalentMarketEligibility(
  talent: TalentMarketContext,
  opportunityCountryCode: CountryCode,
): MarketEligibility {
  if (talent.baseCountryCode === opportunityCountryCode) {
    return { eligible: true, reason: "base_market" };
  }

  if (talent.workMarketCodes?.includes(opportunityCountryCode)) {
    return { eligible: true, reason: "work_market" };
  }

  if (!talent.baseCountryCode && opportunityCountryCode === "SA") {
    return { eligible: true, reason: "legacy_sa" };
  }

  return { eligible: false, reason: "market_mismatch" };
}
