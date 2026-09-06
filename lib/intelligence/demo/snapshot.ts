import type { ExecutiveBrief } from "../executive/brief.ts";

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

type DemoCastingInput = {
  market: "SA";
  project: { id: number };
  roles: Array<{
    needed: number;
    qualified: number;
    sendable: number;
    missing: number;
    blockerCounts: Array<{ reason: string; count: number }>;
  }>;
};

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
