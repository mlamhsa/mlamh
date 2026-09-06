import { createAdminClient } from "@/lib/supabase/admin";
import type {
  IntelligenceDataGap,
  IntelligenceRecommendation,
  IntelligenceSignal,
} from "@/lib/intelligence/core/types";
import { deriveGrowthFunnel, type GrowthFunnelSnapshot } from "./funnel";

export type GrowthIntelligenceSnapshot = {
  generatedAt: string;
  mode: "shadow";
  readOnly: true;
  market: "SA";
  rangeDays: 30;
  funnel: GrowthFunnelSnapshot;
  signal: IntelligenceSignal;
  recommendation: IntelligenceRecommendation;
  dataGaps: IntelligenceDataGap[];
};

function countOrThrow(
  label: string,
  result: { count: number | null; error: { message: string } | null },
) {
  if (result.error) throw new Error(`[intelligence.growth:${label}] ${result.error.message}`);
  return result.count ?? 0;
}

function signalFor(snapshot: GrowthFunnelSnapshot, generatedAt: string): IntelligenceSignal {
  const severity = snapshot.state === "registration_leak"
    ? "warning"
    : snapshot.state === "activation_leak" || snapshot.state === "demand_gap"
      ? "warning"
      : "info";

  return {
    id: `growth:${snapshot.state}:${generatedAt}`,
    domain: "growth",
    type: `growth_${snapshot.state}`,
    market: "SA",
    severity,
    observedAt: generatedAt,
    source: { system: "marketing_events" },
    facts: {
      rangeDays: 30,
      visits: snapshot.visits,
      registrations: snapshot.registrations,
      applications: snapshot.applications,
      briefs: snapshot.briefs,
      registrationRate: snapshot.registrationRate,
      applicationActivationRate: snapshot.applicationActivationRate,
      briefRate: snapshot.briefRate,
    },
    confidence: 1,
    deterministic: true,
  };
}

function recommendationFor(signal: IntelligenceSignal, funnel: GrowthFunnelSnapshot): IntelligenceRecommendation {
  const copy = {
    insufficient_data: {
      title: "Increase measurable acquisition",
      summary: "Attributed traffic is still too sparse for strong growth decisions. Prioritize consistent UTM-tagged acquisition before scaling conclusions.",
      priority: "normal" as const,
    },
    registration_leak: {
      title: "Fix visit-to-registration conversion",
      summary: "The largest observed leak is before registration. Review landing-page message, trust signals, and CTA clarity before increasing traffic volume.",
      priority: "high" as const,
    },
    activation_leak: {
      title: "Improve post-registration activation",
      summary: "Registration is converting, but too few recorded users progress to applications. Prioritize clearer opportunities and activation journeys after signup.",
      priority: "high" as const,
    },
    demand_gap: {
      title: "Increase publisher-side demand",
      summary: "Talent-side activity exists but no demand briefs were recorded in the selected window. Prioritize lead enrichment and approval-ready publisher outreach.",
      priority: "high" as const,
    },
    healthy: {
      title: "Scale the strongest measurable loop",
      summary: "Recorded traffic, registrations, applications, and demand briefs are all moving. Repeat the best measured sources before expanding activity randomly.",
      priority: "normal" as const,
    },
  }[funnel.state];

  return {
    id: `recommendation:${signal.id}`,
    domain: "growth",
    market: "SA",
    title: copy.title,
    summary: copy.summary,
    evidenceSignalIds: [signal.id],
    priority: copy.priority,
    confidence: 1,
    requiresHumanDecision: true,
  };
}

export async function buildGrowthIntelligence(): Promise<GrowthIntelligenceSnapshot> {
  const db = createAdminClient();
  const generatedAt = new Date().toISOString();
  const since = new Date(Date.now() - 30 * 86400000).toISOString();

  function exactCount(eventName: string) {
    return db
      .from("marketing_events")
      .select("id", { count: "exact", head: true })
      .eq("event_name", eventName)
      .gte("occurred_at", since);
  }

  const [visitsResult, registrationsResult, applicationsResult, briefsResult] = await Promise.all([
    exactCount("page_view"),
    exactCount("registration_completed"),
    exactCount("application_submitted"),
    exactCount("brief_received"),
  ]);

  const funnel = deriveGrowthFunnel({
    visits: countOrThrow("visits", visitsResult),
    registrations: countOrThrow("registrations", registrationsResult),
    applications: countOrThrow("applications", applicationsResult),
    briefs: countOrThrow("briefs", briefsResult),
  });
  const signal = signalFor(funnel, generatedAt);

  return {
    generatedAt,
    mode: "shadow",
    readOnly: true,
    market: "SA",
    rangeDays: 30,
    funnel,
    signal,
    recommendation: recommendationFor(signal, funnel),
    dataGaps: [
      {
        key: "growth_source_conversion",
        description: "Source-level conversion requires denominator-safe attribution cohorts before Intelligence can rank channels confidently.",
      },
      {
        key: "growth_retention_cohorts",
        description: "Retention and repeat-application cohorts are not yet part of Growth Intelligence V1.",
      },
    ],
  };
}
