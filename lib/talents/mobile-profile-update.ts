import { SAUDI_CITIES } from "@/lib/data/saudi-cities";
import { createAdminClient } from "@/lib/supabase/admin";

const GENDERS = new Set(["male", "female"]);
const AVAILABILITY = new Set(["available_now", "available_this_week", "available_next_month", "unavailable"]);

export type MobileTalentProfileUpdateInput = {
  displayName?: unknown;
  bio?: unknown;
  skills?: unknown;
  citySlug?: unknown;
  gender?: unknown;
  dateOfBirth?: unknown;
  nationalitySlug?: unknown;
  heightCm?: unknown;
  availabilityStatus?: unknown;
};

function normalizeOptionalText(value: unknown, maxLength: number) {
  if (value === undefined) return { ok: true as const, value: undefined };
  if (value === null) return { ok: true as const, value: null };
  if (typeof value !== "string") return { ok: false as const };
  const normalized = value.trim();
  if (normalized.length > maxLength) return { ok: false as const };
  return { ok: true as const, value: normalized || null };
}

function normalizeSkills(value: unknown) {
  if (value === undefined) return { ok: true as const, value: undefined };
  if (!Array.isArray(value) || value.length > 12) return { ok: false as const };
  const skills = [...new Set(value.map((item) => typeof item === "string" ? item.trim() : "").filter(Boolean))];
  if (skills.some((skill) => skill.length > 40)) return { ok: false as const };
  return { ok: true as const, value: skills };
}

function normalizeEnum(value: unknown, allowed: Set<string>) {
  if (value === undefined) return { ok: true as const, value: undefined };
  if (value === null || value === "") return { ok: true as const, value: null };
  if (typeof value !== "string") return { ok: false as const };
  const normalized = value.trim().toLowerCase();
  return allowed.has(normalized) ? { ok: true as const, value: normalized } : { ok: false as const };
}

function normalizeDate(value: unknown) {
  if (value === undefined) return { ok: true as const, value: undefined };
  if (value === null || value === "") return { ok: true as const, value: null };
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return { ok: false as const };
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return { ok: false as const };
  const today = new Date();
  if (date > today || date.getUTCFullYear() < 1900) return { ok: false as const };
  return { ok: true as const, value };
}

function normalizePositiveNumber(value: unknown, min: number, max: number) {
  if (value === undefined) return { ok: true as const, value: undefined };
  if (value === null || value === "") return { ok: true as const, value: null };
  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numberValue) || numberValue < min || numberValue > max) return { ok: false as const };
  return { ok: true as const, value: numberValue };
}

export async function updateMobileTalentProfile({ userId, locale, input }: { userId: string; locale: "ar" | "en"; input: MobileTalentProfileUpdateInput }) {
  const displayName = normalizeOptionalText(input.displayName, 80);
  const bio = normalizeOptionalText(input.bio, 1200);
  const skills = normalizeSkills(input.skills);
  const gender = normalizeEnum(input.gender, GENDERS);
  const availability = normalizeEnum(input.availabilityStatus, AVAILABILITY);
  const dateOfBirth = normalizeDate(input.dateOfBirth);
  const nationality = normalizeOptionalText(input.nationalitySlug, 80);
  const height = normalizePositiveNumber(input.heightCm, 80, 250);

  let city: (typeof SAUDI_CITIES)[number] | null | undefined = undefined;
  if (input.citySlug === null || input.citySlug === "") city = null;
  else if (input.citySlug !== undefined && typeof input.citySlug === "string") city = SAUDI_CITIES.find((item) => item.slug === input.citySlug.trim()) ?? undefined;
  const cityInvalid = input.citySlug !== undefined && input.citySlug !== null && input.citySlug !== "" && !city;

  if (!displayName.ok || !bio.ok || !skills.ok || !gender.ok || !availability.ok || !dateOfBirth.ok || !nationality.ok || !height.ok || cityInvalid) {
    return { ok: false as const, code: "INVALID_INPUT" as const };
  }

  const values: Record<string, unknown> = {};
  if (displayName.value !== undefined) values[locale === "ar" ? "display_name_ar" : "display_name_en"] = displayName.value;
  if (bio.value !== undefined) values[locale === "ar" ? "bio_ar" : "bio_en"] = bio.value;
  if (skills.value !== undefined) values.skills = skills.value;
  if (gender.value !== undefined) values.gender = gender.value;
  if (availability.value !== undefined) values.availability_status = availability.value;
  if (dateOfBirth.value !== undefined) values.date_of_birth = dateOfBirth.value;
  if (nationality.value !== undefined) {
    values.nationality_slug = nationality.value;
    values.nationality = nationality.value;
  }
  if (height.value !== undefined) values.height_cm = height.value;
  if (city !== undefined) {
    values.city_slug = city?.slug ?? null;
    values.city_ar = city?.ar ?? null;
    values.city_en = city?.en ?? null;
    values.base_country_code = city ? "SA" : null;
  }
  if (Object.keys(values).length === 0) return { ok: false as const, code: "INVALID_INPUT" as const };

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("talents").update(values).eq("user_id", userId).select("id").maybeSingle();
  if (error) return { ok: false as const, code: "UPDATE_FAILED" as const };
  if (!data) return { ok: false as const, code: "TALENT_NOT_FOUND" as const };
  return { ok: true as const, id: Number(data.id) };
}
