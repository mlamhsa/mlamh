import type { CountryCode } from "@/lib/markets/countries";

export type IntelligenceSeverity =
  | "info"
  | "opportunity"
  | "warning"
  | "critical";

export type IntelligenceRiskClass = "green" | "amber" | "red";

export type IntelligenceDomain =
  | "market"
  | "talent_supply"
  | "casting"
  | "growth"
  | "applications"
  | "operations";

export type IntelligenceSignal = {
  id: string;
  domain: IntelligenceDomain;
  type: string;
  market?: CountryCode;
  severity: IntelligenceSeverity;
  observedAt: string;
  source: {
    system: string;
    entityType?: string;
    entityId?: string | number;
  };
  facts: Record<string, unknown>;
  confidence: number;
  deterministic: boolean;
};

export type IntelligenceRecommendation = {
  id: string;
  domain: IntelligenceDomain;
  market?: CountryCode;
  title: string;
  summary: string;
  evidenceSignalIds: string[];
  priority: "low" | "medium" | "high" | "critical";
  confidence: number;
  requiresHumanDecision: boolean;
};

export type IntelligenceDataGap = {
  key: string;
  description: string;
};
