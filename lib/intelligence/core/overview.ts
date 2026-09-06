import { createAdminClient } from "@/lib/supabase/admin";
import { getQualifiedTalents } from "@/lib/talent/supply";
import {
  buildAllIntelligenceMarketContexts,
  type IntelligenceMarketContext,
} from "@/lib/intelligence/markets/context";
import {
  deriveMarketHealth,
  type MarketHealthSnapshot,
} from "@/lib/intelligence/markets/health";
import {
  buildExecutiveBrief,
  type ExecutiveBrief,
} from "@/lib/intelligence/executive/brief";
import type {
  IntelligenceDataGap,
  IntelligenceRecommendation,
  IntelligenceSignal,
} from "@/lib/intelligence/core/types";

export type CommandCenterMarketplaceSummary = {
  talentProfiles: number;
  qualifiedTalents: number;
  publishers: number;
  publishedOpportunities: number;
  applications: number;
  acceptedApplications: number;
  activeConversations: number;
};

export type CommandCenterMarketHealth = {
  countryCode: IntelligenceMarketContext["countryCode"];
  health: MarketHealthSnapshot;
};

export type CommandCenterOverview = {
  generatedAt: string;
  mode: "shadow";
  readOnly: true;
  markets: IntelligenceMarketContext[];
  marketHealth: CommandCenterMarketHealth[];
  marketplace: CommandCenterMarketplaceSummary;
  executiveBrief: ExecutiveBrief;
  criticalSignals: IntelligenceSignal[];
  recommendations: IntelligenceRecommendation[];
  dataGaps: IntelligenceDataGap[];
};

function countOrThrow(
  label: string,
  result: { count: number | null; error: { message: string } | null },
) {
  if (result.error) {
    throw new Error(`[intelligence.overview:${label}] ${result.error.message}`);
  }
  return result.count ?? 0;
}

export async function buildCommandCenterOverview(): Promise<CommandCenterOverview> {
  const db = createAdminClient();
  const generatedAt = new Date().toISOString();

  const [
    talentProfilesResult,
    publishersResult,
    publishedOpportunitiesResult,
    applicationsResult,
    acceptedApplicationsResult,
    activeConversationsResult,
    qualifiedTalents,
  ] = await Promise.all([
    db.from("profiles").select("id", { count: "exact", head: true }).eq("account_type", "talent"),
    db.from("profiles").select("id", { count: "exact", head: true }).eq("account_type", "publisher"),
    db.from("opportunities").select("id", { count: "exact", head: true }).eq("status", "published"),
    db.from("opportunity_applications").select("id", { count: "exact", head: true }),
    db.from("opportunity_applications").select("id", { count: "exact", head: true }).eq("status", "accepted"),
    db.from("conversations").select("id", { count: "exact", head: true }).eq("status", "active"),
    getQualifiedTalents(),
  ]);

  const marketplace: CommandCenterMarketplaceSummary = {
    talentProfiles: countOrThrow("talent_profiles", talentProfilesResult),
    qualifiedTalents: qualifiedTalents.length,
    publishers: countOrThrow("publishers", publishersResult),
    publishedOpportunities: countOrThrow("published_opportunities", publishedOpportunitiesResult),
    applications: countOrThrow("applications", applicationsResult),
    acceptedApplications: countOrThrow("accepted_applications", acceptedApplicationsResult),
    activeConversations: countOrThrow("active_conversations", activeConversationsResult),
  };

  const markets = buildAllIntelligenceMarketContexts();
  const marketHealth: CommandCenterMarketHealth[] = markets.map((market) => ({
    countryCode: market.countryCode,
    health: deriveMarketHealth({
      operational: market.isOperational,
      talents: market.isOperational ? marketplace.qualifiedTalents : 0,
      publishers: market.isOperational ? marketplace.publishers : 0,
      opportunities: market.isOperational ? marketplace.publishedOpportunities : 0,
      applications: market.isOperational ? marketplace.applications : 0,
      acceptedApplications: market.isOperational ? marketplace.acceptedApplications : 0,
      connections: market.isOperational ? marketplace.activeConversations : 0,
    }),
  }));

  const criticalSignals: IntelligenceSignal[] = [];
  const recommendations: IntelligenceRecommendation[] = [];

  if (marketplace.talentProfiles > 0 && marketplace.qualifiedTalents === 0) {
    const signalId = `talent-supply:no-qualified:${generatedAt}`;
    criticalSignals.push({
      id: signalId,
      domain: "talent_supply",
      type: "no_qualified_talent_supply",
      market: "SA",
      severity: "critical",
      observedAt: generatedAt,
      source: { system: "talent_qualification_engine" },
      facts: {
        talentProfiles: marketplace.talentProfiles,
        qualifiedTalents: marketplace.qualifiedTalents,
      },
      confidence: 1,
      deterministic: true,
    });

    recommendations.push({
      id: `recommendation:restore-qualified-supply:${generatedAt}`,
      domain: "talent_supply",
      market: "SA",
      title: "Restore qualified talent supply",
      summary: "Talent profiles exist, but none currently pass the platform qualification rules. Review the dominant qualification blockers before increasing demand.",
      evidenceSignalIds: [signalId],
      priority: "critical",
      confidence: 1,
      requiresHumanDecision: false,
    });
  }

  const saHealth = marketHealth.find((item) => item.countryCode === "SA")?.health;
  if (saHealth?.available && saHealth.score !== null && saHealth.score < 65) {
    const signalId = `market:sa-liquidity:${generatedAt}`;
    criticalSignals.push({
      id: signalId,
      domain: "market",
      type: "sa_operating_liquidity_incomplete",
      market: "SA",
      severity: saHealth.score < 30 ? "warning" : "info",
      observedAt: generatedAt,
      source: { system: "market_health_engine" },
      facts: {
        score: saHealth.score,
        state: saHealth.state,
        components: saHealth.components,
      },
      confidence: 1,
      deterministic: true,
    });
  }

  const executiveBrief = buildExecutiveBrief(marketplace, generatedAt);

  const dataGaps: IntelligenceDataGap[] = [
    {
      key: "market_demand_history",
      description: "Historical demand-weighted market health is not yet calculated; the current score reflects only observable operating-loop presence.",
    },
    {
      key: "city_supply_matrix",
      description: "City-level supply gap aggregation is deferred to a later Talent Supply Intelligence slice.",
    },
  ];

  return {
    generatedAt,
    mode: "shadow",
    readOnly: true,
    markets,
    marketHealth,
    marketplace,
    executiveBrief,
    criticalSignals,
    recommendations,
    dataGaps,
  };
}
