import { createAdminClient } from "@/lib/supabase/admin";
import { isMarketActive } from "@/lib/markets/config";
import { evaluateTalentMarketEligibility } from "@/lib/markets/eligibility";
import { getQualifiedTalents } from "@/lib/talent/supply";
import { buildTalentBriefFromCastingRole } from "@/lib/intelligence/casting/brief";
import type {
  IntelligenceRecommendation,
  IntelligenceSignal,
} from "@/lib/intelligence/core/types";
import {
  buildTalentSupplyCoverageSnapshot,
  type TalentDemandRecord,
  type TalentSupplyCoverageSnapshot,
  type TalentSupplyInventoryRecord,
} from "./coverage";

const OPEN_CASTING_STATUSES = [
  "new",
  "qualified",
  "proposal",
  "awaiting_client",
  "active",
  "screening",
  "shortlist_ready",
  "client_review",
] as const;

type CastingProjectRow = {
  id: number;
  status: string;
  talent_type: string | null;
  required_count: number | null;
  city: string | null;
};

type CastingRoleRow = {
  id: number;
  casting_project_id: number;
  talent_type: string | null;
  required_count: number | null;
  requirements: unknown;
};

export type TalentSupplyIntelligenceOverview = {
  generatedAt: string;
  mode: "shadow";
  readOnly: true;
  market: "SA";
  marketOperational: boolean;
  coverage: TalentSupplyCoverageSnapshot;
  signals: IntelligenceSignal[];
  recommendations: IntelligenceRecommendation[];
};

function talentRole(talent: Record<string, unknown>) {
  const values = [talent.primary_role, talent.category_slug];
  return values.find((value) => typeof value === "string" && value.trim()) as string | undefined;
}

function talentCity(talent: Record<string, unknown>) {
  const values = [talent.city_slug, talent.city_en, talent.city_ar];
  return values.find((value) => typeof value === "string" && value.trim()) as string | undefined;
}

function countFromBrief(brief: { talent_count?: number | null; needed?: number | null }) {
  const value = brief.talent_count ?? brief.needed ?? 1;
  return Number.isFinite(Number(value)) ? Math.max(1, Math.floor(Number(value))) : 1;
}

function buildPressureSignals(
  coverage: TalentSupplyCoverageSnapshot,
  generatedAt: string,
): { signals: IntelligenceSignal[]; recommendations: IntelligenceRecommendation[] } {
  const signals: IntelligenceSignal[] = [];
  const recommendations: IntelligenceRecommendation[] = [];

  for (const segment of coverage.segments) {
    if (!["no_supply", "constrained"].includes(segment.status)) continue;

    const signalId = `talent-supply-pressure:${segment.role}:${segment.city}:${generatedAt}`;
    const severity = segment.status === "no_supply" ? "critical" : "warning";
    signals.push({
      id: signalId,
      domain: "talent_supply",
      type: "baseline_supply_pressure",
      market: "SA",
      severity,
      observedAt: generatedAt,
      source: { system: "talent_supply_coverage" },
      facts: {
        role: segment.role,
        city: segment.city,
        qualifiedSupply: segment.qualifiedSupply,
        pipelineDemand: segment.pipelineDemand,
        openProjects: segment.openProjects,
        pressureRatio: segment.pressureRatio,
        exactMatching: false,
      },
      confidence: 1,
      deterministic: true,
    });

    recommendations.push({
      id: `recommendation:${signalId}`,
      domain: "talent_supply",
      market: "SA",
      title: "Review talent acquisition priority",
      summary:
        segment.status === "no_supply"
          ? `Observed casting demand exists for ${segment.role} talent in ${segment.city}, while the qualified baseline inventory is zero. Validate the active briefs and prioritize targeted acquisition if the demand remains active.`
          : `Observed casting pipeline demand for ${segment.role} talent in ${segment.city} exceeds the qualified baseline inventory. Validate exact brief constraints before increasing acquisition or relaxing requirements.`,
      evidenceSignalIds: [signalId],
      priority: segment.status === "no_supply" ? "critical" : "high",
      confidence: 1,
      requiresHumanDecision: true,
    });
  }

  return { signals, recommendations };
}

export async function buildTalentSupplyIntelligenceOverview(): Promise<TalentSupplyIntelligenceOverview> {
  const generatedAt = new Date().toISOString();
  const marketOperational = isMarketActive("SA");

  if (!marketOperational) {
    return {
      generatedAt,
      mode: "shadow",
      readOnly: true,
      market: "SA",
      marketOperational: false,
      coverage: buildTalentSupplyCoverageSnapshot({ operational: false, talents: [], demand: [] }),
      signals: [],
      recommendations: [],
    };
  }

  const db = createAdminClient();
  const [qualifiedTalents, projectsResult] = await Promise.all([
    getQualifiedTalents(),
    db
      .from("casting_projects")
      .select("id,status,talent_type,required_count,city")
      .in("status", [...OPEN_CASTING_STATUSES]),
  ]);

  if (projectsResult.error) {
    throw new Error(`[intelligence.talent-supply:projects] ${projectsResult.error.message}`);
  }

  const projects = (projectsResult.data ?? []) as CastingProjectRow[];
  const projectIds = projects.map((project) => project.id);

  let roles: CastingRoleRow[] = [];
  if (projectIds.length > 0) {
    const rolesResult = await db
      .from("casting_roles")
      .select("id,casting_project_id,talent_type,required_count,requirements")
      .in("casting_project_id", projectIds);
    if (rolesResult.error) {
      throw new Error(`[intelligence.talent-supply:roles] ${rolesResult.error.message}`);
    }
    roles = (rolesResult.data ?? []) as CastingRoleRow[];
  }

  const inventory: TalentSupplyInventoryRecord[] = qualifiedTalents
    .filter((talent) =>
      evaluateTalentMarketEligibility(
        {
          baseCountryCode: talent.base_country_code,
          workMarketCodes: talent.work_market_codes,
        },
        "SA",
      ).eligible,
    )
    .map((talent) => ({
      role: talentRole(talent),
      city: talentCity(talent),
    }));

  const rolesByProject = new Map<number, CastingRoleRow[]>();
  for (const role of roles) {
    const current = rolesByProject.get(role.casting_project_id) ?? [];
    current.push(role);
    rolesByProject.set(role.casting_project_id, current);
  }

  const demand: TalentDemandRecord[] = [];
  for (const project of projects) {
    const projectRoles = rolesByProject.get(project.id) ?? [];
    if (projectRoles.length === 0) {
      const brief = buildTalentBriefFromCastingRole(
        { ...project, country_code: "SA" },
        null,
      );
      demand.push({
        projectId: project.id,
        roleId: null,
        role: brief.talent_type,
        city: brief.city,
        requiredCount: countFromBrief(brief),
        status: project.status,
      });
      continue;
    }

    for (const role of projectRoles) {
      const brief = buildTalentBriefFromCastingRole(
        { ...project, country_code: "SA" },
        role,
      );
      demand.push({
        projectId: project.id,
        roleId: role.id,
        role: brief.talent_type,
        city: brief.city,
        requiredCount: countFromBrief(brief),
        status: project.status,
      });
    }
  }

  const coverage = buildTalentSupplyCoverageSnapshot({
    operational: true,
    talents: inventory,
    demand,
  });
  const { signals, recommendations } = buildPressureSignals(coverage, generatedAt);

  return {
    generatedAt,
    mode: "shadow",
    readOnly: true,
    market: "SA",
    marketOperational: true,
    coverage,
    signals,
    recommendations,
  };
}
