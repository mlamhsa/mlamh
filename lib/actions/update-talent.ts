"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getNationalityByCode } from "@/lib/data/nationalities";
import { SAUDI_CITIES } from "@/lib/data/saudi-cities";
import { COUNTRY_CODES } from "@/lib/markets/countries";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function requireAdminUser() {
  const authClient = await createServerSupabaseClient();
  const { data: { user }, error } = await authClient.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");

  const adminClient = createAdminClient();
  const { data: adminUser, error: adminError } = await adminClient
    .from("admin_users")
    .select("id")
    .eq("id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (adminError || !adminUser) throw new Error("Forbidden");
}

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nullableStringValue(formData: FormData, key: string) {
  const value = stringValue(formData, key);
  return value.length > 0 ? value : null;
}

function nullableNumberValue(formData: FormData, key: string) {
  const value = stringValue(formData, key);
  if (!value) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function booleanValue(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function nullableBooleanValue(formData: FormData, key: string) {
  const marker = formData.get(`${key}__present`);
  if (marker !== "1") return null;
  return booleanValue(formData, key);
}

function arrayValue(formData: FormData, key: string) {
  const values = formData.getAll(key).flatMap((value) => {
    if (typeof value !== "string") return [];
    return value.split(/[,،\n]/).map((item) => item.trim()).filter(Boolean);
  });
  return Array.from(new Set(values));
}

function createSlug(value: string, id: number) {
  const base = value.toLowerCase().trim().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return base ? `${base}-${id}` : `talent-${id}`;
}

function createValueSlug(value: string) {
  return value.toLowerCase().trim().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function getAvailabilityStatus(formData: FormData) {
  const value = stringValue(formData, "availability_status");
  const allowed = ["available_now", "available_this_week", "available_next_month", "unavailable"];
  return allowed.includes(value) ? value : "available_now";
}

function getPrimaryRole(formData: FormData): "actor" | "model" | null {
  const value = stringValue(formData, "primary_role");
  return value === "actor" || value === "model" ? value : null;
}

function getGender(formData: FormData) {
  const value = stringValue(formData, "gender");
  return value === "male" || value === "female" ? value : null;
}

function getBaseCountryCode(formData: FormData) {
  const value = stringValue(formData, "base_country_code").toUpperCase();
  const country = getNationalityByCode(value);
  return country?.code ?? null;
}

function getWorkMarketCodes(formData: FormData, existing: unknown) {
  // Work markets are currently hidden while MLAMH is Saudi-only. Preserve any
  // historical values unless the editor explicitly opts into editing them in a
  // future market-activation release.
  if (formData.get("work_market_codes__present") !== "1") {
    return Array.isArray(existing)
      ? existing.filter((value): value is string => typeof value === "string")
      : [];
  }

  return arrayValue(formData, "work_market_codes").filter((value) =>
    COUNTRY_CODES.includes(value as (typeof COUNTRY_CODES)[number]),
  );
}

function getCity(formData: FormData) {
  const slug = stringValue(formData, "city_slug");
  return SAUDI_CITIES.find((city) => city.slug === slug) ?? null;
}

function getNationality(formData: FormData) {
  const code = stringValue(formData, "nationality_code");
  const nationality = getNationalityByCode(code);
  if (!nationality) return null;
  return {
    value: nationality.en,
    slug: createValueSlug(nationality.en),
  };
}

export async function updateTalentAction(formData: FormData): Promise<void> {
  await requireAdminUser();

  const id = nullableNumberValue(formData, "id");
  if (!id) throw new Error("Invalid talent id");

  const supabase = createAdminClient();
  const { data: currentTalent, error: currentTalentError } = await supabase
    .from("talents")
    .select("work_market_codes")
    .eq("id", id)
    .maybeSingle();

  if (currentTalentError) {
    throw new Error(`[updateTalentAction.currentTalent] ${currentTalentError.message}`);
  }

  const nameEn = stringValue(formData, "name_en");
  const slug = createSlug(nameEn, id);
  const verified = booleanValue(formData, "verified");
  const currentVerifiedAt = nullableStringValue(formData, "current_verified_at");
  const language = stringValue(formData, "return_lang") === "en" ? "en" : "ar";
  const primaryRole = getPrimaryRole(formData);
  const city = getCity(formData);
  const nationality = getNationality(formData);

  const payload = {
    slug,
    name_en: nameEn,
    name_ar: stringValue(formData, "name_ar"),
    display_name_en: nullableStringValue(formData, "display_name_en"),
    display_name_ar: nullableStringValue(formData, "display_name_ar"),

    primary_role: primaryRole,
    category_slug: primaryRole,
    category_en: primaryRole === "actor" ? "Actor" : primaryRole === "model" ? "Model" : "",
    category_ar: primaryRole === "actor" ? "ممثل" : primaryRole === "model" ? "مودل" : "",

    city_en: city?.en ?? null,
    city_ar: city?.ar ?? null,
    city_slug: city?.slug ?? null,
    base_country_code: getBaseCountryCode(formData),
    work_market_codes: getWorkMarketCodes(formData, currentTalent?.work_market_codes),
    nationality: nationality?.value ?? null,
    nationality_slug: nationality?.slug ?? null,
    gender: getGender(formData),
    date_of_birth: nullableStringValue(formData, "date_of_birth"),
    age: nullableNumberValue(formData, "age"),

    bio_en: nullableStringValue(formData, "bio_en"),
    bio_ar: nullableStringValue(formData, "bio_ar"),
    languages: arrayValue(formData, "languages"),
    language_level: arrayValue(formData, "language_level"),
    dialects: arrayValue(formData, "dialects"),
    skills: arrayValue(formData, "skills"),
    experience_years: nullableNumberValue(formData, "experience_years"),
    previous_work: nullableStringValue(formData, "previous_work"),

    height: nullableStringValue(formData, "height"),
    height_cm: nullableNumberValue(formData, "height_cm"),
    weight_kg: nullableNumberValue(formData, "weight_kg"),
    eye_color: nullableStringValue(formData, "eye_color"),
    hair_color: nullableStringValue(formData, "hair_color"),
    hair_type: nullableStringValue(formData, "hair_type"),
    skin_color: nullableStringValue(formData, "skin_color"),
    clothing_size: nullableStringValue(formData, "clothing_size"),
    shoe_size: nullableNumberValue(formData, "shoe_size"),
    chest_size: nullableNumberValue(formData, "chest_size"),
    waist_size: nullableNumberValue(formData, "waist_size"),
    hip_size: nullableNumberValue(formData, "hip_size"),
    beard: nullableBooleanValue(formData, "beard"),
    mustache: nullableBooleanValue(formData, "mustache"),
    hijab: nullableBooleanValue(formData, "hijab"),
    tattoos: nullableBooleanValue(formData, "tattoos"),
    scars: nullableBooleanValue(formData, "scars"),
    glasses: nullableBooleanValue(formData, "glasses"),

    whatsapp: nullableStringValue(formData, "whatsapp"),
    instagram: nullableStringValue(formData, "instagram"),
    tiktok: nullableStringValue(formData, "tiktok"),
    snapchat: nullableStringValue(formData, "snapchat"),
    portfolio_url: nullableStringValue(formData, "portfolio_url"),
    portfolio_links: arrayValue(formData, "portfolio_links"),
    video_intro: nullableStringValue(formData, "video_intro"),
    showreel_url: nullableStringValue(formData, "showreel_url"),

    ready_to_travel: nullableBooleanValue(formData, "ready_to_travel"),
    has_passport: nullableBooleanValue(formData, "has_passport"),
    has_car: nullableBooleanValue(formData, "has_car"),
    work_outside_city: nullableBooleanValue(formData, "work_outside_city"),
    work_outside_country: nullableBooleanValue(formData, "work_outside_country"),

    sort_order: nullableNumberValue(formData, "sort_order"),
    availability_status: getAvailabilityStatus(formData),
    verified,
    verified_at: verified ? currentVerifiedAt || new Date().toISOString() : null,
  };

  const { error } = await supabase.from("talents").update(payload).eq("id", id);
  if (error) throw new Error(`[updateTalentAction] ${error.message}`);

  revalidatePath("/admin");
  revalidatePath("/admin/talents");
  revalidatePath(`/admin/talents/${id}`);
  revalidatePath(`/admin/talents/${id}/edit`);
  revalidatePath("/ar/talent");
  revalidatePath("/en/talent");
  revalidatePath(`/ar/talent/${slug}`);
  revalidatePath(`/en/talent/${slug}`);

  redirect(`/admin/talents/${id}/edit?lang=${language}&updated=1`);
}