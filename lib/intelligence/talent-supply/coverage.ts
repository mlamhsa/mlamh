export type TalentSupplyCoverageStatus =
  | "covered"
  | "constrained"
  | "no_supply"
  | "reserve"
  | "insufficient_data";

export type TalentSupplyInventoryRecord = {
  role?: string | null;
  city?: string | null;
};

export type TalentDemandRecord = {
  projectId: number;
  roleId?: number | null;
  role?: string | null;
  city?: string | null;
  requiredCount: number;
  status: string;
};

export type TalentSupplyCoverageSegment = {
  role: string;
  city: string;
  qualifiedSupply: number;
  pipelineDemand: number;
  openProjects: number;
  pressureRatio: number | null;
  status: TalentSupplyCoverageStatus;
};

export type TalentSupplyCoverageSnapshot = {
  operational: boolean;
  exactMatching: false;
  interpretation: "baseline_role_city_coverage";
  qualifiedTalentCount: number;
  openDemandCount: number;
  openProjectCount: number;
  segments: TalentSupplyCoverageSegment[];
};

function normalize(value?: string | null) {
  return typeof value === "string" && value.trim()
    ? value.trim().toLowerCase()
    : "unknown";
}

function positiveInteger(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function segmentKey(role: string, city: string) {
  return `${role}::${city}`;
}

function statusFor(params: {
  role: string;
  city: string;
  supply: number;
  demand: number;
}): TalentSupplyCoverageStatus {
  if (params.role === "unknown" || params.city === "unknown") return "insufficient_data";
  if (params.demand <= 0) return params.supply > 0 ? "reserve" : "insufficient_data";
  if (params.supply <= 0) return "no_supply";
  if (params.demand > params.supply) return "constrained";
  return "covered";
}

export function buildTalentSupplyCoverageSnapshot(params: {
  operational: boolean;
  talents: TalentSupplyInventoryRecord[];
  demand: TalentDemandRecord[];
}): TalentSupplyCoverageSnapshot {
  if (!params.operational) {
    return {
      operational: false,
      exactMatching: false,
      interpretation: "baseline_role_city_coverage",
      qualifiedTalentCount: 0,
      openDemandCount: 0,
      openProjectCount: 0,
      segments: [],
    };
  }

  const supplyBySegment = new Map<string, number>();
  const demandBySegment = new Map<string, { demand: number; projects: Set<number> }>();
  const segmentDimensions = new Map<string, { role: string; city: string }>();

  for (const talent of params.talents) {
    const role = normalize(talent.role);
    const city = normalize(talent.city);
    const key = segmentKey(role, city);
    segmentDimensions.set(key, { role, city });
    supplyBySegment.set(key, (supplyBySegment.get(key) ?? 0) + 1);
  }

  for (const item of params.demand) {
    const role = normalize(item.role);
    const city = normalize(item.city);
    const key = segmentKey(role, city);
    const requiredCount = positiveInteger(item.requiredCount);
    segmentDimensions.set(key, { role, city });
    const current = demandBySegment.get(key) ?? { demand: 0, projects: new Set<number>() };
    current.demand += requiredCount;
    current.projects.add(item.projectId);
    demandBySegment.set(key, current);
  }

  const statusWeight: Record<TalentSupplyCoverageStatus, number> = {
    no_supply: 0,
    constrained: 1,
    insufficient_data: 2,
    covered: 3,
    reserve: 4,
  };

  const segments = [...segmentDimensions.entries()]
    .map(([key, dimensions]): TalentSupplyCoverageSegment => {
      const qualifiedSupply = supplyBySegment.get(key) ?? 0;
      const demandState = demandBySegment.get(key);
      const pipelineDemand = demandState?.demand ?? 0;
      const status = statusFor({
        role: dimensions.role,
        city: dimensions.city,
        supply: qualifiedSupply,
        demand: pipelineDemand,
      });

      return {
        role: dimensions.role,
        city: dimensions.city,
        qualifiedSupply,
        pipelineDemand,
        openProjects: demandState?.projects.size ?? 0,
        pressureRatio:
          pipelineDemand > 0 && qualifiedSupply > 0
            ? Math.round((pipelineDemand / qualifiedSupply) * 100) / 100
            : null,
        status,
      };
    })
    .sort(
      (a, b) =>
        statusWeight[a.status] - statusWeight[b.status] ||
        b.pipelineDemand - a.pipelineDemand ||
        a.city.localeCompare(b.city) ||
        a.role.localeCompare(b.role),
    );

  return {
    operational: true,
    exactMatching: false,
    interpretation: "baseline_role_city_coverage",
    qualifiedTalentCount: params.talents.length,
    openDemandCount: params.demand.reduce(
      (sum, item) => sum + positiveInteger(item.requiredCount),
      0,
    ),
    openProjectCount: new Set(params.demand.map((item) => item.projectId)).size,
    segments,
  };
}
