import { COUNTRY_CODES, COUNTRY_REGISTRY, type CountryCode } from "@/lib/markets/countries";
import { MARKET_CONFIG } from "@/lib/markets/config";

export type IntelligenceMarketContext = {
  countryCode: CountryCode;
  nameAr: string;
  nameEn: string;
  currency: string;
  configuredStatus: "active" | "prepared" | "future";
  operationalStatus: "active" | "not_activated";
  isOperational: boolean;
  capabilities: {
    talentRegistration: boolean;
    publisherRegistration: boolean;
    opportunityCreation: boolean;
    applications: boolean;
    publicTalentDirectory: boolean;
    publicOpportunities: boolean;
    search: boolean;
    payments: boolean;
    seoIndexing: boolean;
  };
};

export function buildIntelligenceMarketContext(
  countryCode: CountryCode,
): IntelligenceMarketContext {
  const country = COUNTRY_REGISTRY[countryCode];
  const market = MARKET_CONFIG[countryCode];
  const isOperational = market.status === "active";

  return {
    countryCode,
    nameAr: country.nameAr,
    nameEn: country.nameEn,
    currency: market.currency,
    configuredStatus: market.status,
    operationalStatus: isOperational ? "active" : "not_activated",
    isOperational,
    capabilities: { ...market.features },
  };
}

export function buildAllIntelligenceMarketContexts() {
  return COUNTRY_CODES.map(buildIntelligenceMarketContext);
}
