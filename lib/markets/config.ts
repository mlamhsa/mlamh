import {
  COUNTRY_REGISTRY,
  type CountryCode,
} from "./countries.ts";

export type MarketStatus = "active" | "prepared" | "future";

export type MarketFeatureFlags = {
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

export type MarketConfig = {
  countryCode: CountryCode;
  status: MarketStatus;
  currency: string;
  features: MarketFeatureFlags;
};

const ALL_DISABLED: MarketFeatureFlags = {
  talentRegistration: false,
  publisherRegistration: false,
  opportunityCreation: false,
  applications: false,
  publicTalentDirectory: false,
  publicOpportunities: false,
  search: false,
  payments: false,
  seoIndexing: false,
};

const SAUDI_ACTIVE_FEATURES: MarketFeatureFlags = {
  talentRegistration: true,
  publisherRegistration: true,
  opportunityCreation: true,
  applications: true,
  publicTalentDirectory: true,
  publicOpportunities: true,
  search: true,
  payments: true,
  seoIndexing: true,
};

export const MARKET_CONFIG: Record<CountryCode, MarketConfig> = {
  SA: {
    countryCode: "SA",
    status: "active",
    currency: COUNTRY_REGISTRY.SA.defaultCurrency,
    features: SAUDI_ACTIVE_FEATURES,
  },
  AE: {
    countryCode: "AE",
    status: "prepared",
    currency: COUNTRY_REGISTRY.AE.defaultCurrency,
    features: ALL_DISABLED,
  },
  EG: {
    countryCode: "EG",
    status: "prepared",
    currency: COUNTRY_REGISTRY.EG.defaultCurrency,
    features: ALL_DISABLED,
  },
  MA: {
    countryCode: "MA",
    status: "prepared",
    currency: COUNTRY_REGISTRY.MA.defaultCurrency,
    features: ALL_DISABLED,
  },
  QA: {
    countryCode: "QA",
    status: "prepared",
    currency: COUNTRY_REGISTRY.QA.defaultCurrency,
    features: ALL_DISABLED,
  },
  JO: {
    countryCode: "JO",
    status: "future",
    currency: COUNTRY_REGISTRY.JO.defaultCurrency,
    features: ALL_DISABLED,
  },
  LB: {
    countryCode: "LB",
    status: "future",
    currency: COUNTRY_REGISTRY.LB.defaultCurrency,
    features: ALL_DISABLED,
  },
  KW: {
    countryCode: "KW",
    status: "future",
    currency: COUNTRY_REGISTRY.KW.defaultCurrency,
    features: ALL_DISABLED,
  },
};

export type MarketFeature = keyof MarketFeatureFlags;

export function getMarketConfig(countryCode: CountryCode): MarketConfig {
  return MARKET_CONFIG[countryCode];
}

export function isMarketActive(countryCode: CountryCode): boolean {
  return MARKET_CONFIG[countryCode].status === "active";
}

export function isMarketFeatureEnabled(
  countryCode: CountryCode,
  feature: MarketFeature,
): boolean {
  return MARKET_CONFIG[countryCode].features[feature] === true;
}

export function resolveMarketCurrency(countryCode: CountryCode): string {
  return MARKET_CONFIG[countryCode].currency;
}
