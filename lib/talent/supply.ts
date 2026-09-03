import {
  evaluateTalentQualification,
  type TalentQualificationEvaluation,
  type TalentQualificationInput,
} from "./qualification.ts";
import {
  evaluateTalentMarketEligibility,
} from "../markets/eligibility.ts";
import { isCountryCode, type CountryCode } from "../markets/countries.ts";

export type TalentBrief = {
  talent_count?: number | null;
  needed?: number | null;
  talent_type?: string | null;
  role?: string | null;
  country_code?: CountryCode | null;
  city?: string | null;
  city_required?: boolean | null;
  city_flexible?: boolean | null;
  required_gender?: string | null;
  gender?: string | null;
  availability_status?: string | string[] | null;
  availability_required?: boolean | null;
  requirements?: Record<string, unknown> | null;
};

export type BriefTalent = TalentQualificationInput & {
  user_id?: string | null;
  base_country_code?: CountryCode | null;
  work_market_codes?: CountryCode[] | null;
  gender?: string | null;
  availability_status?: string | null;
  nationality?: string | null;
  nationality_slug?: string | null;
  languages?: string[] | null;
  dialects?: string[] | null;
  skills?: string[] | null;
  modeling_types?: string[] | null;
  ready_to_travel?: boolean | null;
  has_passport?: boolean | null;
  has_car?: boolean | null;
  work_outside_city?: boolean | null;
  work_outside_country?: boolean | null;
  hijab?: boolean | null;
  beard?: boolean | null;
  mustache?: boolean | null;
  glasses?: boolean | null;
  hair_color?: string | null;
  eye_color?: string | null;
  skin_color?: string | null;
  clothing_size?: string | null;
  [key: string]: unknown;
};

export type TalentBriefEvaluation = {
  sendable: boolean;
  status: "sendable_for_brief" | "not_sendable_for_brief";
  reasons: string[];
  qualification: TalentQualificationEvaluation;
};

export type TalentSupplyGap = {
  needed: number;
  available: number;
  missing: number;
  reasons: string[];
};

export type TalentSupplyCandidateEvaluation = {
  talent: BriefTalent;
  qualification: TalentQualificationEvaluation;
  briefEvaluation: TalentBriefEvaluation | null;
  sendable: boolean;
  reasons: string[];
};

export type TalentSupplyEvaluation = {
  candidatePool: BriefTalent[];
  qualifiedTalents: BriefTalent[];
  sendableTalents: BriefTalent[];
  evaluations: TalentSupplyCandidateEvaluation[];
};

const SUPPORTED_HARD_FIELDS = new Set([
  "nationality",
  "nationality_slug",
  "languages",
  "dialects",
  "skills",
  "modeling_types",
  "ready_to_travel",
  "has_passport",
  "has_car",
  "work_outside_city",
  "work_outside_country",
  "hijab",
  "beard",
  "mustache",
  "glasses",
  "hair_color",
  "eye_color",
  "skin_color",
  "clothing_size",
]);

function text(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function valuesEqual(actual: unknown, expected: unknown) {
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) return false;
    const actualValues = actual.map(text).filter(Boolean);
    return expected.map(text).filter(Boolean).every((value) => actualValues.includes(value));
  }
  if (typeof expected === "boolean") return actual === expected;
  return text(actual) === text(expected);
}

function isMissing(value: unknown) {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return !value.trim();
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function getRoleRequirement(brief: TalentBrief) {
  return text(brief.role) || text(brief.talent_type) || text(brief.requirements?.role) || text(brief.requirements?.talent_type);
}

function getRequiredGender(brief: TalentBrief) {
  return text(brief.required_gender) || text(brief.gender) || text(brief.requirements?.required_gender) || text(brief.requirements?.gender);
}

function getRequiredAvailability(brief: TalentBrief): string[] {
  const raw = brief.availability_status ?? brief.requirements?.availability_status;
  if (Array.isArray(raw)) return raw.map(text).filter(Boolean);
  const normalized = text(raw);
  return normalized ? [normalized] : [];
}

function getTalentRole(talent: BriefTalent, qualification: TalentQualificationEvaluation) {
  return text(talent.primary_role) || text(talent.category_slug) || text(qualification.role);
}

function getTalentCity(talent: BriefTalent) {
  return text(talent.city_slug) || text(talent.city_en) || text(talent.city_ar);
}

function getBriefCountryCode(brief: TalentBrief): CountryCode {
  if (brief.country_code) return brief.country_code;
  const fromRequirements = brief.requirements?.country_code;
  if (typeof fromRequirements === "string") {
    const normalized = fromRequirements.trim().toUpperCase();
    if (isCountryCode(normalized)) return normalized;
  }
  return "SA";
}

export function evaluateTalentForBrief(
  talent: BriefTalent,
  brief: TalentBrief,
): TalentBriefEvaluation {
  const qualification = evaluateTalentQualification(talent);
  const reasons: string[] = [];

  if (!qualification.qualified) {
    reasons.push(...qualification.reasons.map((reason) => `not_qualified:${reason}`));
  }

  const briefCountryCode = getBriefCountryCode(brief);
  const marketEligibility = evaluateTalentMarketEligibility(
    {
      baseCountryCode: talent.base_country_code,
      workMarketCodes: talent.work_market_codes,
    },
    briefCountryCode,
  );
  if (!marketEligibility.eligible) reasons.push("market_mismatch");

  const requiredRole = getRoleRequirement(brief);
  if (requiredRole && requiredRole !== "mixed") {
    const actualRole = getTalentRole(talent, qualification);
    if (!actualRole) reasons.push("missing_required_role");
    else if (actualRole !== requiredRole) reasons.push("role_mismatch");
  }

  const requiredCity = text(brief.city) || text(brief.requirements?.city);
  const cityFlexible =
    brief.city_flexible === true ||
    brief.requirements?.city_flexible === true ||
    brief.city_required === false ||
    brief.requirements?.city_required === false;
  if (requiredCity && !cityFlexible) {
    const actualCity = getTalentCity(talent);
    if (!actualCity) reasons.push("missing_required_city");
    else if (actualCity !== requiredCity) reasons.push("city_mismatch");
  }

  const requiredGender = getRequiredGender(brief);
  if (requiredGender) {
    const actualGender = text(talent.gender);
    if (!actualGender) reasons.push("missing_required_gender");
    else if (actualGender !== requiredGender) reasons.push("gender_mismatch");
  }

  const requiredAvailability = getRequiredAvailability(brief);
  const availabilityRequired =
    brief.availability_required === true ||
    brief.requirements?.availability_required === true ||
    requiredAvailability.length > 0;
  if (availabilityRequired) {
    const actualAvailability = text(talent.availability_status);
    if (!actualAvailability) reasons.push("missing_required_availability");
    else if (requiredAvailability.length > 0 && !requiredAvailability.includes(actualAvailability)) reasons.push("availability_mismatch");
    else if (requiredAvailability.length === 0 && ["unavailable", "busy"].includes(actualAvailability)) reasons.push("availability_mismatch");
  }

  const requirements = brief.requirements ?? {};
  for (const [field, expected] of Object.entries(requirements)) {
    if (!SUPPORTED_HARD_FIELDS.has(field) || expected === null || expected === undefined) continue;
    const actual = talent[field];
    if (isMissing(actual)) reasons.push(`missing_required_${field}`);
    else if (!valuesEqual(actual, expected)) reasons.push(`${field}_mismatch`);
  }

  const uniqueReasons = Array.from(new Set(reasons));
  const sendable = uniqueReasons.length === 0;
  return {
    sendable,
    status: sendable ? "sendable_for_brief" : "not_sendable_for_brief",
    reasons: uniqueReasons,
    qualification,
  };
}

export function evaluateTalentSupplyForBrief(
  brief: TalentBrief,
  candidatePool: BriefTalent[],
): TalentSupplyEvaluation {
  const evaluations = candidatePool.map((talent): TalentSupplyCandidateEvaluation => {
    const qualification = evaluateTalentQualification(talent);
    if (!qualification.qualified) {
      return {
        talent,
        qualification,
        briefEvaluation: null,
        sendable: false,
        reasons: qualification.reasons.map((reason) => `not_qualified:${reason}`),
      };
    }
    const briefEvaluation = evaluateTalentForBrief(talent, brief);
    return {
      talent,
      qualification,
      briefEvaluation,
      sendable: briefEvaluation.sendable,
      reasons: briefEvaluation.reasons,
    };
  });

  return {
    candidatePool,
    qualifiedTalents: evaluations.filter(({ qualification }) => qualification.qualified).map(({ talent }) => talent),
    sendableTalents: evaluations.filter(({ sendable }) => sendable).map(({ talent }) => talent),
    evaluations,
  };
}

export function calculateTalentSupplyGap(
  brief: TalentBrief,
  supply: TalentSupplyEvaluation,
): TalentSupplyGap {
  const rawNeeded = brief.talent_count ?? brief.needed ?? 1;
  const needed = Math.max(1, Number.isFinite(Number(rawNeeded)) ? Math.floor(Number(rawNeeded)) : 1);
  const available = supply.sendableTalents.length;
  const missing = Math.max(0, needed - available);
  const reasons = missing > 0
    ? Array.from(new Set(["insufficient_matches", ...supply.evaluations.flatMap((evaluation) => evaluation.reasons)]))
    : [];
  return { needed, available, missing, reasons };
}

async function getTalentCandidatePool(): Promise<BriefTalent[]> {
  const { createAdminClient } = await import("../supabase/admin");
  const supabase = createAdminClient();
  const { data: talentRows, error } = await supabase
    .from("talents")
    .select("*")
    .eq("published", true);
  if (error) throw new Error(`[getQualifiedTalents] ${error.message}`);

  const talents = (talentRows ?? []) as BriefTalent[];
  const userIds = talents
    .map((talent) => (typeof talent.user_id === "string" ? talent.user_id : null))
    .filter((value): value is string => Boolean(value));
  const talentIds = talents
    .map((talent) => Number(talent.id))
    .filter((value) => Number.isInteger(value) && value > 0);

  const profileByUserId = new Map<string, { approval_status?: string | null; status?: string | null }>();
  if (userIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, approval_status, status")
      .in("user_id", userIds);
    if (profileError) throw new Error(`[getQualifiedTalents:profiles] ${profileError.message}`);
    for (const profile of profiles ?? []) profileByUserId.set(profile.user_id, profile);
  }

  const workMarketsByTalentId = new Map<number, CountryCode[]>();
  if (talentIds.length > 0) {
    const { data: workMarkets, error: workMarketError } = await supabase
      .from("talent_work_markets")
      .select("talent_id, country_code")
      .in("talent_id", talentIds);
    if (workMarketError) throw new Error(`[getQualifiedTalents:work-markets] ${workMarketError.message}`);

    for (const row of workMarkets ?? []) {
      const talentId = Number(row.talent_id);
      const countryCode = typeof row.country_code === "string" ? row.country_code.toUpperCase() : "";
      if (!Number.isInteger(talentId) || !isCountryCode(countryCode)) continue;
      const current = workMarketsByTalentId.get(talentId) ?? [];
      if (!current.includes(countryCode)) current.push(countryCode);
      workMarketsByTalentId.set(talentId, current);
    }
  }

  return talents.map((talent) => {
    const profile = talent.user_id ? profileByUserId.get(String(talent.user_id)) : undefined;
    const talentId = Number(talent.id);
    return {
      ...talent,
      work_market_codes: Number.isInteger(talentId) ? workMarketsByTalentId.get(talentId) ?? [] : [],
      profile_approval_status: profile?.approval_status,
      profile_status: profile?.status,
    } satisfies BriefTalent;
  });
}

export async function getQualifiedTalents(): Promise<BriefTalent[]> {
  const candidatePool = await getTalentCandidatePool();
  return candidatePool.filter((talent) => evaluateTalentQualification(talent).qualified);
}

export async function getTalentSupplyForBrief(
  brief: TalentBrief,
): Promise<TalentSupplyEvaluation> {
  const candidatePool = await getTalentCandidatePool();
  return evaluateTalentSupplyForBrief(brief, candidatePool);
}
