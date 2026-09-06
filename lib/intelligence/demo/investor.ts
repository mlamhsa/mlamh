import { createAdminClient } from "@/lib/supabase/admin";
import { buildCommandCenterOverview } from "@/lib/intelligence/core/overview";
import {
  buildCastingProjectIntelligence,
  type CastingProjectIntelligence,
} from "@/lib/intelligence/casting/project-intelligence";
import type { ExecutiveBrief } from "@/lib/intelligence/executive/brief";

export type InvestorDemoRole = {
  label: string;
  needed: number;
  qualified: number;
  sendable: number;
  missing: number;
  topBlockers: Array<{ reason: string; count: number }>;
};

export type InvestorDemoSnapshot = {
  generatedAt: string;
  mode: "investor_demo";
  readOnly: true;
  sanitized: true;
  market: "SA";
  source: "live_engine";
  scenario: {
    projectId: number;
    label: string;
    roles: InvestorDemoRole[];
    totalNeeded: number;
    totalSendable: number;
    totalMissing: number;
    status: "covered" | "supply_gap";
  } | null;
  executive: ExecutiveBrief;
  proof: {
    qualificationEngine: true;
    supplyEngine: true;
    marketPolicy: true;
    deterministicMetrics: true;
    externalExecution: false;
    coreWrites: false;
  };
};

type DemoCastingInput = Pick<CastingProjectIntelligence, "project" | "roles" | "market">;

export function buildInvestorDemoSnapshotFromInputs(params: {
  generatedAt: string;
  executive: ExecutiveBrief;
  casting: DemoCastingInput | null;
}): InvestorDemoSnapshot {
  const scenario = params.casting
    ? (() => {
        const roles = params.casting.roles.map((role, index) => ({
          label: `Role ${index + 1}`,
          needed: role.needed,
          qualified: role.qualified,
          sendable: role.sendable,
          missing: role.missing,
          topBlockers: role.blockerCounts.slice(0, 3),
        }));
        const totalNeeded = roles.reduce((sum, role) => sum + role.needed, 0);
        const totalSendable = roles.reduce((sum, role) => sum + role.sendable, 0);
        const totalMissing = roles.reduce((sum, role) => sum + role.missing, 0);

        return {
          projectId: params.casting.project.id,
          label: `Casting Scenario #${params.casting.project.id}`,
          roles,
          totalNeeded,
          totalSendable,
          totalMissing,
          status: totalMissing > 0 ? ("supply_gap" as const) : ("covered" as const),
        };
      })()
    : null;

  return {
    generatedAt: params.generatedAt,
    mode: "investor_demo",
    readOnly: true,
    sanitized: true,
    market: "SA",
    source: "live_engine",
    scenario,
    executive: params.executive,
    proof: {
      qualificationEngine: true,
      supplyEngine: true,
      marketPolicy: true,
      deterministicMetrics: true,
      externalExecution: false,
      coreWrites: false,
    },
  };
}

async function resolveScenarioProjectId(requestedProjectId?: number | null): Promise<number | null> {
  const db = createAdminClient();

  if (requestedProjectId && Number.isInteger(requestedProjectId) && requestedProjectId > 0) {
    const { data, error } = await db
      .from("casting_projects")
      .select("id")
      .eq("id", requestedProjectId)
      .maybeSingle();
    if (error) throw new Error(`[intelligence.demo:project] ${error.message}`);
    return data?.id ?? null;
  }

  const { data, error } = await db
    .from("casting_projects")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`[intelligence.demo:latest_project] ${error.message}`);
  return data?.id ?? null;
}

export async function buildInvestorDemoSnapshot(
  requestedProjectId?: number | null,
): Promise<InvestorDemoSnapshot> {
  const overview = await buildCommandCenterOverview();
  const projectId = await resolveScenarioProjectId(requestedProjectId);
  const casting = projectId ? await buildCastingProjectIntelligence(projectId) : null;

  return buildInvestorDemoSnapshotFromInputs({
    generatedAt: overview.generatedAt,
    executive: overview.executiveBrief,
    casting,
  });
}
