import { findNationality } from "@/lib/data/nationalities";
import { SAUDI_CITIES } from "@/lib/data/saudi-cities";
import { createAdminClient } from "@/lib/supabase/admin";

const TALENT_ROLES = new Set(["actor", "model"]);
const GENDERS = new Set(["male", "female"]);
const AVAILABILITY = new Set(["available_now", "available_this_week", "available_next_month", "unavailable"]);
const EYE_COLORS = new Set(["brown", "black", "blue", "green", "hazel", "gray"]);
const HAIR_COLORS = new Set(["black", "brown", "blonde", "red", "gray", "white", "dyed", "bald"]);
const HAIR_TYPES = new Set(["straight", "wavy", "curly", "coily", "bald", "covered"]);
const SKIN_COLORS = new Set(["fair", "light", "medium", "olive", "tan", "brown", "dark"]);
const CLOTHING_SIZES = new Set(["XS", "S", "M", "L", "XL", "XXL"]);

export type MobileTalentProfileUpdateInput = {
  primaryRole?: unknown; displayName?: unknown; bio?: unknown; skills?: unknown; citySlug?: unknown; gender?: unknown; dateOfBirth?: unknown; nationalitySlug?: unknown; heightCm?: unknown; availabilityStatus?: unknown;
  languages?: unknown; dialects?: unknown; weightKg?: unknown; eyeColor?: unknown; hairColor?: unknown; hairType?: unknown; skinColor?: unknown; clothingSize?: unknown; shoeSize?: unknown;
  actingAgeMin?: unknown; actingAgeMax?: unknown; modelingTypes?: unknown; experienceYears?: unknown; readyToTravel?: unknown; hasPassport?: unknown; hasCar?: unknown; workOutsideCity?: unknown; workOutsideCountry?: unknown;
};

function normalizeOptionalText(value: unknown, maxLength: number) { if (value === undefined) return { ok: true as const, value: undefined }; if (value === null) return { ok: true as const, value: null }; if (typeof value !== "string") return { ok: false as const }; const normalized = value.trim(); if (normalized.length > maxLength) return { ok: false as const }; return { ok: true as const, value: normalized || null }; }
function normalizeArray(value: unknown, maxItems: number, maxLength: number) { if (value === undefined) return { ok: true as const, value: undefined }; if (!Array.isArray(value) || value.length > maxItems) return { ok: false as const }; const values = [...new Set(value.map((item) => typeof item === "string" ? item.trim() : "").filter(Boolean))]; if (values.some((item) => item.length > maxLength)) return { ok: false as const }; return { ok: true as const, value: values }; }
function normalizeEnum(value: unknown, allowed: Set<string>, preserveCase = false) { if (value === undefined) return { ok: true as const, value: undefined }; if (value === null || value === "") return { ok: true as const, value: null }; if (typeof value !== "string") return { ok: false as const }; const normalized = preserveCase ? value.trim().toUpperCase() : value.trim().toLowerCase(); return allowed.has(normalized) ? { ok: true as const, value: normalized } : { ok: false as const }; }
function normalizeDate(value: unknown) { if (value === undefined) return { ok: true as const, value: undefined }; if (value === null || value === "") return { ok: true as const, value: null }; if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return { ok: false as const }; const date = new Date(`${value}T00:00:00Z`); if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return { ok: false as const }; const today = new Date(); if (date > today || date.getUTCFullYear() < 1900) return { ok: false as const }; return { ok: true as const, value }; }
function normalizeNumber(value: unknown, min: number, max: number, integer = false) { if (value === undefined) return { ok: true as const, value: undefined }; if (value === null || value === "") return { ok: true as const, value: null }; const numberValue = typeof value === "number" ? value : Number(value); if (!Number.isFinite(numberValue) || numberValue < min || numberValue > max || (integer && !Number.isInteger(numberValue))) return { ok: false as const }; return { ok: true as const, value: numberValue }; }
function normalizeBoolean(value: unknown) { if (value === undefined) return { ok: true as const, value: undefined }; if (typeof value !== "boolean") return { ok: false as const }; return { ok: true as const, value }; }
function normalizeNationality(value: unknown) {
  if (value === undefined) return { ok: true as const, value: undefined };
  if (value === null || value === "") return { ok: true as const, value: null };
  if (typeof value !== "string") return { ok: false as const };
  const match = findNationality(value);
  return match ? { ok: true as const, value: match } : { ok: false as const };
}

export async function updateMobileTalentProfile({ userId, locale, input }: { userId: string; locale: "ar" | "en"; input: MobileTalentProfileUpdateInput }) {
  const primaryRole = normalizeEnum(input.primaryRole, TALENT_ROLES); const displayName = normalizeOptionalText(input.displayName, 80); const bio = normalizeOptionalText(input.bio, 1200); const skills = normalizeArray(input.skills, 12, 40); const languages = normalizeArray(input.languages, 8, 40); const dialects = normalizeArray(input.dialects, 8, 40); const modelingTypes = normalizeArray(input.modelingTypes, 8, 40);
  const gender = normalizeEnum(input.gender, GENDERS); const availability = normalizeEnum(input.availabilityStatus, AVAILABILITY); const eyeColor = normalizeEnum(input.eyeColor, EYE_COLORS); const hairColor = normalizeEnum(input.hairColor, HAIR_COLORS); const hairType = normalizeEnum(input.hairType, HAIR_TYPES); const skinColor = normalizeEnum(input.skinColor, SKIN_COLORS); const clothingSize = normalizeEnum(input.clothingSize, CLOTHING_SIZES, true);
  const dateOfBirth = normalizeDate(input.dateOfBirth); const nationality = normalizeNationality(input.nationalitySlug); const height = normalizeNumber(input.heightCm, 80, 250); const weight = normalizeNumber(input.weightKg, 20, 350); const shoeSize = normalizeNumber(input.shoeSize, 15, 60); const actingAgeMin = normalizeNumber(input.actingAgeMin, 0, 120, true); const actingAgeMax = normalizeNumber(input.actingAgeMax, 0, 120, true); const experienceYears = normalizeNumber(input.experienceYears, 0, 80, true);
  const readyToTravel = normalizeBoolean(input.readyToTravel); const hasPassport = normalizeBoolean(input.hasPassport); const hasCar = normalizeBoolean(input.hasCar); const workOutsideCity = normalizeBoolean(input.workOutsideCity); const workOutsideCountry = normalizeBoolean(input.workOutsideCountry);

  let city: (typeof SAUDI_CITIES)[number] | null | undefined = undefined;
  if (input.citySlug === null || input.citySlug === "") city = null;
  else if (input.citySlug !== undefined && typeof input.citySlug === "string") city = SAUDI_CITIES.find((item) => item.slug === input.citySlug.trim()) ?? undefined;
  const cityInvalid = input.citySlug !== undefined && input.citySlug !== null && input.citySlug !== "" && !city;

  const fields = [primaryRole,displayName,bio,skills,languages,dialects,modelingTypes,gender,availability,eyeColor,hairColor,hairType,skinColor,clothingSize,dateOfBirth,nationality,height,weight,shoeSize,actingAgeMin,actingAgeMax,experienceYears,readyToTravel,hasPassport,hasCar,workOutsideCity,workOutsideCountry];
  if (fields.some((field) => !field.ok) || cityInvalid) return { ok: false as const, code: "INVALID_INPUT" as const };
  if (actingAgeMin.value != null && actingAgeMax.value != null && actingAgeMin.value > actingAgeMax.value) return { ok: false as const, code: "INVALID_INPUT" as const };

  const values: Record<string, unknown> = {};
  if (primaryRole.value !== undefined) {
    values.primary_role = primaryRole.value;
    values.category_slug = primaryRole.value;
    values.category_ar = primaryRole.value === "actor" ? "ممثل" : primaryRole.value === "model" ? "مودل" : null;
    values.category_en = primaryRole.value === "actor" ? "Actor" : primaryRole.value === "model" ? "Model" : null;
  }
  if (displayName.value !== undefined) values[locale === "ar" ? "display_name_ar" : "display_name_en"] = displayName.value;
  if (bio.value !== undefined) values[locale === "ar" ? "bio_ar" : "bio_en"] = bio.value;
  if (skills.value !== undefined) values.skills = skills.value; if (languages.value !== undefined) values.languages = languages.value; if (dialects.value !== undefined) values.dialects = dialects.value; if (modelingTypes.value !== undefined) values.modeling_types = modelingTypes.value;
  if (gender.value !== undefined) values.gender = gender.value; if (availability.value !== undefined) values.availability_status = availability.value; if (eyeColor.value !== undefined) values.eye_color = eyeColor.value; if (hairColor.value !== undefined) values.hair_color = hairColor.value; if (hairType.value !== undefined) values.hair_type = hairType.value; if (skinColor.value !== undefined) values.skin_color = skinColor.value; if (clothingSize.value !== undefined) values.clothing_size = clothingSize.value;
  if (dateOfBirth.value !== undefined) values.date_of_birth = dateOfBirth.value;
  if (nationality.value !== undefined) { values.nationality_slug = nationality.value?.slug ?? null; values.nationality = nationality.value ? (locale === "ar" ? nationality.value.ar : nationality.value.en) : null; }
  if (height.value !== undefined) values.height_cm = height.value; if (weight.value !== undefined) values.weight_kg = weight.value; if (shoeSize.value !== undefined) values.shoe_size = shoeSize.value; if (actingAgeMin.value !== undefined) values.acting_age_min = actingAgeMin.value; if (actingAgeMax.value !== undefined) values.acting_age_max = actingAgeMax.value; if (experienceYears.value !== undefined) values.experience_years = experienceYears.value;
  if (readyToTravel.value !== undefined) values.ready_to_travel = readyToTravel.value; if (hasPassport.value !== undefined) values.has_passport = hasPassport.value; if (hasCar.value !== undefined) values.has_car = hasCar.value; if (workOutsideCity.value !== undefined) values.work_outside_city = workOutsideCity.value; if (workOutsideCountry.value !== undefined) values.work_outside_country = workOutsideCountry.value;
  if (city !== undefined) { values.city_slug = city?.slug ?? null; values.city_ar = city?.ar ?? null; values.city_en = city?.en ?? null; values.base_country_code = city ? "SA" : null; }
  if (Object.keys(values).length === 0) return { ok: false as const, code: "INVALID_INPUT" as const };

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("talents").update(values).eq("user_id", userId).select("id").maybeSingle();
  if (error) return { ok: false as const, code: "UPDATE_FAILED" as const };
  if (!data) return { ok: false as const, code: "TALENT_NOT_FOUND" as const };
  return { ok: true as const, id: Number(data.id) };
}
