"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getNationalityByCode } from "@/lib/data/nationalities";
import { SAUDI_CITIES } from "@/lib/data/saudi-cities";
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

function getBaseCountryCode(formData: FormData, existing: unknown) {
  const value = stringValue(formData, "base_country_code").toUpperCase();
  if (!value) {
    return typeof existing === "string" && existing.trim()
      ? existing.trim().toUpperCase()
      : null;
  }

  const country = getNationalityByCode(value);
  return country?.code ?? (
    typeof existing === "string" && existing.trim()
      ? existing.trim().toUpperCase()
      : null
  );
}

function getCity(formData: FormData, existing: {
  city_slug?: unknown;
  city_ar?: unknown;
  city_en?: unknown;
}) {
  const slug = stringValue(formData, "city_slug");
  const selected = SAUDI_CITIES.find((city) => city.slug === slug);

  if (selected) {
    return {
      slug: selected.slug,
      ar: selected.ar,
      en: selected.en,
    };
  }

  // If an older record contains a city that is not currently editable in the
  // Saudi-only UI, keep it untouched rather than wiping it during an unrelated
  // admin save.
  const existingSlug = typeof existing.city_slug === "string"
    ? existing.city_slug.trim()
    : "";

  return {
    slug: existingSlug || null,
    ar: typeof existing.city_ar === "string" && existing.city_ar.trim()
      ? existing.city_ar.trim()
      : null,
    en: typeof existing.city_en === "string" && existing.city_en.trim()
      ? existing.city_en.trim()
      : null,
  };
}

function getNationality(formData: FormData, existing: {
  nationality?: unknown;
  nationality_slug?: unknown;
}) {
  const code = stringValue(formData, "nationality_code");
  const nationality = getNationalityByCode(code);

  if (nationality) {
    return {
      value: nationality.en,
      slug: createValueSlug(nationality.en),
    };
  }

  // Preserve legacy values that do not yet map exactly to the global registry.
  // They can be normalized later only when the admin explicitly selects a
  // nationality from the controlled list.
  return {
    value: typeof existing.nationality === "string" && existing.nationality.trim()
      ? existing.nationality.trim()
      : null,
    slug: typeof existing.nationality_slug === "string" && existing.nationality_slug.trim()
      ? existing.nationality_slug.trim()
      : null,
  };
}

export async function updateTalentAction(formData: FormData): Promise<void> {
  await requireAdminUser();

  const id = nullableNumberValue(formData, "id");
  if (!id) throw new Error("Invalid talent id");

  const supabase = createAdminClient();
  const { data: currentTalent, error: currentTalentError } = await supabase
    .from("talents")
    .select("base_country_code,city_slug,city_ar,city_en,nationality,nationality_slug")
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
  const city = getCity(formData, currentTalent ?? {});
  const nationality = getNationality(formData, currentTalent ?? {});

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

    city_en: city.en,
    city_ar: city.ar,
    city_slug: city.slug,
    base_country_code: getBaseCountryCode(formData, currentTalent?.base_country_code),
    nationality: nationality.value,
    nationality_slug: nationality.slug,
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