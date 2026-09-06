import { createAdminClient } from "@/lib/supabase/admin";
import { isMarketActive } from "@/lib/markets/config";
import { isCountryCode, type CountryCode } from "@/lib/markets/countries";
import {
  calculateTalentSupplyGap,
  getTalentSupplyForBrief,
  type TalentSupplyGap,
} from "@/lib/talent/supply";
import type {
  IntelligenceRecommendation,
  IntelligenceSignal,
} from "@/lib/intelligence/core/types";
import { buildTalentBriefFromCastingRole } from "./brief";

type CastingProjectRow = {
  id: number;
  project_title: string;
  talent_type: string | null;
  required_count: number | null;
  city: string | null;
  country_code?: string | null;
};

type CastingRoleRow = {
  id: number;
  title: string;
  title_en: string | null;
  talent_type: string | null;
  required_count: number | null;
  requirements: unknown;
};

export type CastingRoleIntelligence = {
  roleId: number | null;
  title: string;
  needed: number;
  qualified: number;
  sendable: number;
  missing: number;
  blockerCounts: Array<{ reason: string; count: number }>;
  gap: TalentSupplyGap;
  signal: IntelligenceSignal | null;
  recommendation: IntelligenceRecommendation | null;
};

export type CastingProjectIntelligence = {
  generatedAt: string;
  mode: "shadow";
  readOnly: true;
  project: CastingProjectRow;
  market: CountryCode;
  marketOperational: boolean;
  roles: CastingRoleIntelligence[];
};

function resolveCountryCode(value: unknown): CountryCode {
  if (typeof value === "string") {
    const normalized = value.trim().toUpperCase();
    if (isCountryCode(normalized)) return normalized;
  }
  return "SA";
}

function blockerCounts(reasons: string[]) {
  const counts = new Map<string, number>();
  for (const reason of reasons) counts.set(reason, (counts.get(reason) ?? 0) + 1);
  return [...counts.entries()]
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count || a.reason.localeCompare(b.reason));
}

function buildGapSignal(params: {
  generatedAt: string;
  projectId: number;
  roleId: number | null;
  market: CountryCode;
  gap: TalentSupplyGap;
  qualified: number;
}): IntelligenceSignal | null {
  if (params.gap.missing <= 0) return null;
  return {
    id: `casting-gap:${params.projectId}:${params.roleId ?? "project"}:${params.generatedAt}`,
    domain: "casting",
    type: "casting_supply_gap",
    market: params.market,
    severity: params.gap.available === 0 ? "critical" : "warning",
    observedAt: params.generatedAt,
    source: {
      system: "talent_supply_engine",
      entityType: params.roleId ? "casting_role" : "casting_project",
      entityId: params.roleId ?? params.projectId,
    },
    facts: {
      needed: params.gap.needed,
      qualified: params.qualified,
      sendable: params.gap.available,
      missing: params.gap.missing,
      reasons: params.gap.reasons,
    },
    confidence: 1,
    deterministic: true,
  };
}

function buildGapRecommendation(signal: IntelligenceSignal | null): IntelligenceRecommendation | null {
  if (!signal) return null;
  const missing = Number(signal.facts.missing ?? 0);
  return {
    id: `recommendation:${signal.id}`,
    domain: "casting",
    market: signal.market,
    title: "Resolve casting supply gap",
    summary: `The current brief is short by ${missing} sendable talent${missing === 1 ? "" : "s"}. Review the dominant deterministic blockers before expanding outreach or changing hard requirements.`,
    evidenceSignalIds: [signal.id],
    priority: signal.severity === "critical" ? "critical" : "high",
    confidence: 1,
    requiresHumanDecision: true,
  };
}

async function analyzeRole(
  project: CastingProjectRow,
  role: CastingRoleRow | null,
  market: CountryCode,
  generatedAt: string,
): Promise<CastingRoleIntelligence> {
  const brief = buildTalentBriefFromCastingRole(
    { ...project, country_code: market },
    role,
  );
  const supply = await getTalentSupplyForBrief(brief);
  const gap = calculateTalentSupplyGap(brief, supply);
  const allReasons = supply.evaluations.flatMap((evaluation) => evaluation.reasons);
  const signal = buildGapSignal({
    generatedAt,
    projectId: project.id,
    roleId: role?.id ?? null,
    market,
    gap,
    qualified: supply.qualifiedTalents.length,
  });

  return {
    roleId: role?.id ?? null,
    title: role?.title || project.project_title,
    needed: gap.needed,
    qualified: supply.qualifiedTalents.length,
    sendable: supply.sendableTalents.length,
    missing: gap.missing,
    blockerCounts: blockerCounts(allReasons).slice(0, 8),
    gap,
    signal,
    recommendation: buildGapRecommendation(signal),
  };
}

export async function buildCastingProjectIntelligence(
  projectId: number,
): Promise<CastingProjectIntelligence | null> {
  const db = createAdminClient();
  const generatedAt = new Date().toISOString();
  const { data: projectData, error: projectError } = await db
    .from("casting_projects")
    .select("id,project_title,talent_type,required_count,city,country_code")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError) {
    throw new Error(`[intelligence.casting:project] ${projectError.message}`);
  }
  if (!projectData) return null;

  const project = projectData as CastingProjectRow;
  const market = resolveCountryCode(project.country_code);
  const marketOperational = isMarketActive(market);

  if (!marketOperational) {
    return {
      generatedAt,
      mode: "shadow",
      readOnly: true,
      project,
      market,
      marketOperational: false,
      roles: [],
    };
  }

  const { data: roleData, error: rolesError } = await db
    .from("casting_roles")
    .select("id,title,title_en,talent_type,required_count,requirements")
    .eq("casting_project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (rolesError) {
    throw new Error(`[intelligence.casting:roles] ${rolesError.message}`);
  }

  const roleRows = (roleData ?? []) as CastingRoleRow[];
  const roles = roleRows.length
    ? await Promise.all(roleRows.map((role) => analyzeRole(project, role, market, generatedAt)))
    : [await analyzeRole(project, null, market, generatedAt)];

  return {
    generatedAt,
    mode: "shadow",
    readOnly: true,
    project,
    market,
    marketOperational: true,
    roles,
  };
}
