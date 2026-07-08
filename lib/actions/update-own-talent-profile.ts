"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import {
  availabilityValue,
  booleanValue,
  createDisplayName,
  createSlug,
  dateValue,
  getSelectedCategory,
  getSelectedCity,
  nullableNumberValue,
  nullableStringValue,
  requiredStringValue,
  stringArrayValue,
} from "@/lib/actions/talent-profile-utils";

async function getCurrentUser() {
  const authClient = await createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();

  if (error || !user) {
    redirect("/ar/login");
  }

  return user;
}

function buildTalentSharedPayload(formData: FormData) {
  const selectedCategory = getSelectedCategory(formData);
  const selectedCity = getSelectedCity(formData);
  const galleryImages = stringArrayValue(formData, "gallery_images");
  const nationalitySlug = nullableStringValue(formData, "nationality_slug");

  return {
    category_slug: selectedCategory.category_slug,
    category_en: selectedCategory.category_en,
    category_ar: selectedCategory.category_ar,

    city_slug: selectedCity.city_slug,
    city_en: selectedCity.city_en,
    city_ar: selectedCity.city_ar,

    gender: nullableStringValue(formData, "gender"),
    date_of_birth: dateValue(formData, "date_of_birth"),

    nationality_slug: nationalitySlug,
    nationality: nationalitySlug,

    languages: stringArrayValue(formData, "languages"),
    dialects: stringArrayValue(formData, "dialects"),
    skills: stringArrayValue(formData, "skills"),

    bio_en: nullableStringValue(formData, "bio_en"),
    bio_ar: nullableStringValue(formData, "bio_ar"),

    instagram: nullableStringValue(formData, "instagram"),
    tiktok: nullableStringValue(formData, "tiktok"),
    snapchat: nullableStringValue(formData, "snapchat"),
    portfolio_url: nullableStringValue(formData, "portfolio_url"),

    availability_status: availabilityValue(formData),

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

    experience_years: nullableNumberValue(formData, "experience_years"),
    video_intro: nullableStringValue(formData, "video_intro"),
    showreel_url: nullableStringValue(formData, "showreel_url"),

    ready_to_travel: booleanValue(formData, "ready_to_travel"),
    has_passport: booleanValue(formData, "has_passport"),
    has_car: booleanValue(formData, "has_car"),
    work_outside_city: booleanValue(formData, "work_outside_city"),
    work_outside_country: booleanValue(formData, "work_outside_country"),

    image_url: requiredStringValue(formData, "image_url"),
    gallery_images: galleryImages,
  };
}

export async function createOwnTalentProfileAction(formData: FormData) {
  const user = await getCurrentUser();
  const adminClient = createAdminClient();

  const { data: existingTalent } = await adminClient
    .from("talents")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingTalent) {
    redirect("/ar/talent-dashboard/profile");
  }

  const nameEn = requiredStringValue(formData, "name_en");
  const nameAr = requiredStringValue(formData, "name_ar");

  const sharedPayload = buildTalentSharedPayload(formData);

  const payload = {
    user_id: user.id,

    name_en: nameEn,
    name_ar: nameAr,
    display_name_en: createDisplayName(nameEn),
    display_name_ar: createDisplayName(nameAr),

    ...sharedPayload,

    featured: false,
    verified: false,
    published: false,
    status: "pending",
    sort_order: null,
  };

  const { data: createdTalent, error: insertError } = await adminClient
    .from("talents")
    .insert(payload)
    .select("id, slug, category_slug, city_slug")
    .maybeSingle();

  if (insertError || !createdTalent) {
    throw new Error(
      "[createOwnTalentProfileAction] " +
        (insertError?.message || "Failed to create talent profile.")
    );
  }

  if (!createdTalent.category_slug || !createdTalent.city_slug) {
    throw new Error(
      "[createOwnTalentProfileAction] Talent profile was created, but category_slug or city_slug was not saved."
    );
  }

  const slug = createSlug(nameEn, createdTalent.id);

  const { error: slugError } = await adminClient
    .from("talents")
    .update({ slug })
    .eq("id", createdTalent.id)
    .eq("user_id", user.id);

  if (slugError) {
    throw new Error("[createOwnTalentProfileAction] " + slugError.message);
  }

  revalidatePath("/talent-dashboard");
  revalidatePath("/talent-dashboard/profile");
  revalidatePath("/ar/talent-dashboard");
  revalidatePath("/ar/talent-dashboard/profile");

  redirect("/ar/talent-dashboard/profile?created=1");
}

export async function updateOwnTalentProfileAction(formData: FormData) {
  const user = await getCurrentUser();
  const adminClient = createAdminClient();

  const { data: talent, error: talentError } = await adminClient
    .from("talents")
    .select("id, slug")
    .eq("user_id", user.id)
    .maybeSingle();

  if (talentError || !talent) {
    throw new Error("No linked talent profile found.");
  }

  const payload = buildTalentSharedPayload(formData);

  const { data: updatedTalent, error: updateError } = await adminClient
    .from("talents")
    .update(payload)
    .eq("id", talent.id)
    .eq("user_id", user.id)
    .select("id, category_slug, city_slug")
    .maybeSingle();

  if (updateError || !updatedTalent) {
    throw new Error(
      "[updateOwnTalentProfileAction] " +
        (updateError?.message || "Failed to update talent profile.")
    );
  }

  if (!updatedTalent.category_slug || !updatedTalent.city_slug) {
    throw new Error(
      "[updateOwnTalentProfileAction] Talent profile was updated, but category_slug or city_slug was not saved."
    );
  }

  revalidatePath("/talent-dashboard");
  revalidatePath("/talent-dashboard/profile");
  revalidatePath("/ar/talent-dashboard");
  revalidatePath("/ar/talent-dashboard/profile");
  revalidatePath("/en/talent-dashboard");
  revalidatePath("/en/talent-dashboard/profile");

  if (talent.slug) {
    revalidatePath(`/ar/talent/${talent.slug}`);
    revalidatePath(`/en/talent/${talent.slug}`);
  }

  redirect("/ar/talent-dashboard/profile?updated=1");
}