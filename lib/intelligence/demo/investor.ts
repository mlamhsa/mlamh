import { createAdminClient } from "@/lib/supabase/admin";
import { buildCommandCenterOverview } from "@/lib/intelligence/core/overview";
import { buildCastingProjectIntelligence } from "@/lib/intelligence/casting/project-intelligence";
import {
  buildInvestorDemoSnapshotFromInputs,
  type InvestorDemoSnapshot,
} from "./snapshot";

export type { InvestorDemoRole, InvestorDemoSnapshot } from "./snapshot";

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
    casting: casting
      ? {
          market: "SA",
          project: { id: casting.project.id },
          roles: casting.roles.map((role) => ({
            needed: role.needed,
            qualified: role.qualified,
            sendable: role.sendable,
            missing: role.missing,
            blockerCounts: role.blockerCounts,
          })),
        }
      : null,
  });
}
