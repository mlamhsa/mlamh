import type { CountryCode } from "@/lib/markets/countries";
import type { TalentBrief } from "@/lib/talent/supply";

type CastingProjectLike = {
  talent_type?: string | null;
  required_count?: number | null;
  city?: string | null;
  country_code?: CountryCode | null;
};

type CastingRoleLike = {
  talent_type?: string | null;
  required_count?: number | null;
  requirements?: unknown;
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function buildTalentBriefFromCastingRole(
  project: CastingProjectLike,
  role?: CastingRoleLike | null,
): TalentBrief {
  const requirements = record(role?.requirements);
  const countryCode = project.country_code ?? "SA";
  const roleTalentType = text(role?.talent_type) ?? text(project.talent_type);
  const city = text(requirements.city) ?? text(project.city);
  const gender = text(requirements.gender);
  const availability = requirements.availability_status;
  const cityFlexible = requirements.city_flexible === true || requirements.city_required === false;
  const rawCount = role?.required_count ?? project.required_count ?? 1;
  const needed = Number.isFinite(Number(rawCount)) ? Math.max(1, Math.floor(Number(rawCount))) : 1;

  return {
    country_code: countryCode,
    talent_count: needed,
    talent_type: roleTalentType,
    city,
    city_flexible: cityFlexible,
    required_gender: gender,
    availability_status:
      typeof availability === "string" || Array.isArray(availability)
        ? (availability as string | string[])
        : null,
    requirements,
  };
}
