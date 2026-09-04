"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdminUser() {
  const authClient = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();

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
  const raw = stringValue(formData, key);
  if (!raw) return [];

  return Array.from(
    new Set(
      raw
        .split(/[,،\n]/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function createSlug(value: string, id: number) {
  const base = value
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return base ? `${base}-${id}` : `talent-${id}`;
}

function getAvailabilityStatus(formData: FormData) {
  const value = stringValue(formData, "availability_status");
  const allowed = [
    "available_now",
    "available_this_week",
    "available_next_month",
    "unavailable",
  ];
  return allowed.includes(value) ? value : "available_now";
}

export async function updateTalentAction(formData: FormData): Promise<void> {
  await requireAdminUser();

  const id = nullableNumberValue(formData, "id");
  if (!id) throw new Error("Invalid talent id");

  const nameEn = stringValue(formData, "name_en");
  const slug = createSlug(nameEn, id);
  const verified = booleanValue(formData, "verified");
  const currentVerifiedAt = nullableStringValue(formData, "current_verified_at");
  const language = stringValue(formData, "return_lang") === "en" ? "en" : "ar";

  const payload = {
    slug,
    name_en: nameEn,
    name_ar: stringValue(formData, "name_ar"),
    display_name_en: nullableStringValue(formData, "display_name_en"),
    display_name_ar: nullableStringValue(formData, "display_name_ar"),
    category_en: stringValue(formData, "category_en"),
    category_ar: stringValue(formData, "category_ar"),

    city_en: nullableStringValue(formData, "city_en"),
    city_ar: nullableStringValue(formData, "city_ar"),
    city_slug: nullableStringValue(formData, "city_slug"),
    base_country_code: nullableStringValue(formData, "base_country_code"),
    work_market_codes: arrayValue(formData, "work_market_codes"),
    nationality: nullableStringValue(formData, "nationality"),
    nationality_slug: nullableStringValue(formData, "nationality_slug"),
    gender: nullableStringValue(formData, "gender"),
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

  const supabase = createAdminClient();
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
