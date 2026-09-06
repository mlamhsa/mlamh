export type MarketHealthInput = {
  operational: boolean;
  talents: number;
  publishers: number;
  opportunities: number;
  applications: number;
  acceptedApplications: number;
  connections: number;
};

export type MarketHealthState = "not_applicable" | "cold" | "developing" | "active" | "healthy";

export type MarketHealthSnapshot = {
  available: boolean;
  state: MarketHealthState;
  score: number | null;
  components: {
    supplyPresent: boolean;
    publisherPresent: boolean;
    demandPresent: boolean;
    applicationFlow: boolean;
    selectionFlow: boolean;
    connectionFlow: boolean;
  };
  explanation: string;
};

/**
 * Deterministic operating-liquidity heuristic for an already-active market.
 * This is not a forecast, valuation, or AI-generated score. It only indicates
 * how much of MLAMH's observable operating loop is currently present.
 */
export function deriveMarketHealth(input: MarketHealthInput): MarketHealthSnapshot {
  if (!input.operational) {
    return {
      available: false,
      state: "not_applicable",
      score: null,
      components: {
        supplyPresent: false,
        publisherPresent: false,
        demandPresent: false,
        applicationFlow: false,
        selectionFlow: false,
        connectionFlow: false,
      },
      explanation: "Market is not operational; live health is not calculated.",
    };
  }

  const components = {
    supplyPresent: input.talents > 0,
    publisherPresent: input.publishers > 0,
    demandPresent: input.opportunities > 0,
    applicationFlow: input.applications > 0,
    selectionFlow: input.acceptedApplications > 0,
    connectionFlow: input.connections > 0,
  };

  const score =
    (components.supplyPresent ? 20 : 0) +
    (components.publisherPresent ? 10 : 0) +
    (components.demandPresent ? 20 : 0) +
    (components.applicationFlow ? 20 : 0) +
    (components.selectionFlow ? 15 : 0) +
    (components.connectionFlow ? 15 : 0);

  const state: MarketHealthState =
    score >= 90 ? "healthy" : score >= 65 ? "active" : score >= 30 ? "developing" : "cold";

  return {
    available: true,
    state,
    score,
    components,
    explanation: "Deterministic liquidity score based on observable supply, demand, applications, selections, and connections.",
  };
}
