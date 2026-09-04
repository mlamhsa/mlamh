"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  availabilityValue,
  booleanValue,
  createDisplayName,
  createSlug,
  dateValue,
  getSelectedCategory,
  getSelectedCity,
  getSelectedNationality,
  nullableNumberValue,
  nullableStringValue,
  positiveNullableNumberValue,
  requiredStringValue,
  stringArrayValue,
} from "@/lib/actions/talent-profile-utils";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type Locale = "ar" | "en";

type ExistingTalentData = {
  nationality_slug?: string | null;
  nationality?: string | null;
  height_cm?: number | string | null;
  weight_kg?: number | string | null;
  shoe_size?: number | string | null;
  chest_size?: number | string | null;
  waist_size?: number | string | null;
  hip_size?: number | string | null;
};

async function getCurrentUser(locale: Locale) {
  const authClient = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();

  if (error || !user) redirect(`/${locale}/login`);
  return user;
}

function normalizeComparable(value: string | null | undefined) {
  return (value ?? "").trim();
}

export async function getOwnTalentProfileAction(locale: Locale) {
  const user = await getCurrentUser(locale);
  const adminClient = createAdminClient();

  const [
    { data: talent, error: talentError },
    { data: profile, error: profileError },
  ] = await Promise.all([
    adminClient.from("talents").select("*").eq("user_id", user.id).maybeSingle(),
    adminClient
      .from("profiles")
      .select(`id, phone, approval_status`)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (talentError) {
    throw new Error("[getOwnTalentProfileAction talent] " + talentError.message);
  }
  if (profileError) {
    throw new Error("[getOwnTalentProfileAction profile] " + profileError.message);
  }

  let reviewReason = "";
  if (profile?.id && profile.approval_status === "changes_requested") {
    const { data: latestReview, error: latestReviewError } = await adminClient
      .from("profile_review_history")
      .select(`reason, created_at`)
      .eq("profile_id", profile.id)
      .eq("account_type", "talent")
      .eq("decision", "changes_requested")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestReviewError) {
      console.error("[getOwnTalentProfileAction review]", latestReviewError.message);
    }
    reviewReason = String(latestReview?.reason ?? "").trim();
  }

  if (!talent) return null;

  return {
    ...talent,
    phone: profile?.phone ?? "",
    approval_status: profile?.approval_status ?? "not_submitted",
    review_reason: reviewReason,
  };
}

export async function getOwnPendingTalentProfileChangeAction(locale: Locale) {
  const user = await getCurrentUser(locale);
  const adminClient = createAdminClient();

  const { data: talent, error: talentError } = await adminClient
    .from("talents")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (talentError) {
    throw new Error("[getOwnPendingTalentProfileChangeAction talent] " + talentError.message);
  }
  if (!talent) return null;

  const { data: pendingRequest, error: pendingRequestError } = await adminClient
    .from("talent_profile_change_requests")
    .select(`
      id,
      requested_name_ar,
      requested_name_en,
      requested_phone,
      requested_nationality_slug,
      status,
      created_at
    `)
    .eq("talent_id", talent.id)
    .eq("status", "pending")
    .maybeSingle();

  if (pendingRequestError) {
    throw new Error(
      "[getOwnPendingTalentProfileChangeAction request] " + pendingRequestError.message,
    );
  }

  return pendingRequest;
}

function buildTalentSharedPayload(
  formData: FormData,
  existingTalent?: ExistingTalentData,
) {
  const selectedCategory = getSelectedCategory(formData);
  const selectedCity = getSelectedCity(formData);
  const selectedNationality = getSelectedNationality(
    formData,
    existingTalent?.nationality_slug ?? existingTalent?.nationality ?? null,
  );
  const galleryImages = stringArrayValue(formData, "gallery_images");
  const primaryRole = nullableStringValue(formData, "primary_role");
  const modelingTypes = stringArrayValue(formData, "modeling_types");

  return {
    category_slug: selectedCategory.category_slug,
    category_en: selectedCategory.category_en,
    category_ar: selectedCategory.category_ar,
    primary_role: primaryRole,
    acting_age_min: nullableNumberValue(formData, "acting_age_min"),
    acting_age_max: nullableNumberValue(formData, "acting_age_max"),
    modeling_types: modelingTypes,

    // The active web market is Saudi Arabia. Keep country and city semantics
    // consistent server-side rather than trusting a hidden browser field.
    base_country_code: "SA",
    city_slug: selectedCity.city_slug,
    city_en: selectedCity.city_en,
    city_ar: selectedCity.city_ar,

    gender: nullableStringValue(formData, "gender"),
    date_of_birth: dateValue(formData, "date_of_birth"),
    nationality_slug: selectedNationality.slug,
    nationality: selectedNationality.slug,
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

    height_cm: positiveNullableNumberValue(
      formData,
      "height_cm",
      existingTalent?.height_cm,
    ),
    weight_kg: positiveNullableNumberValue(
      formData,
      "weight_kg",
      existingTalent?.weight_kg,
    ),
    eye_color: nullableStringValue(formData, "eye_color"),
    hair_color: nullableStringValue(formData, "hair_color"),
    hair_type: nullableStringValue(formData, "hair_type"),
    skin_color: nullableStringValue(formData, "skin_color"),
    clothing_size: nullableStringValue(formData, "clothing_size"),
    shoe_size: positiveNullableNumberValue(
      formData,
      "shoe_size",
      existingTalent?.shoe_size,
    ),
    chest_size: positiveNullableNumberValue(
      formData,
      "chest_size",
      existingTalent?.chest_size,
    ),
    waist_size: positiveNullableNumberValue(
      formData,
      "waist_size",
      existingTalent?.waist_size,
    ),
    hip_size: positiveNullableNumberValue(
      formData,
      "hip_size",
      existingTalent?.hip_size,
    ),

    experience_years: nullableNumberValue(formData, "experience_years"),
    video_intro: nullableStringValue(formData, "video_intro"),
    showreel_url: nullableStringValue(formData, "showreel_url"),
    ready_to_travel: booleanValue(formData, "ready_to_travel"),
    has_passport: booleanValue(formData, "has_passport"),
    has_car: booleanValue(formData, "has_car"),
    work_outside_city: booleanValue(formData, "work_outside_city"),
    work_outside_country: booleanValue(formData, "work_outside_country"),
    image_url: nullableStringValue(formData, "image_url"),
    gallery_images: galleryImages,
  };
}

export async function createOwnTalentProfileAction(formData: FormData) {
  const locale: Locale = formData.get("locale") === "en" ? "en" : "ar";
  const user = await getCurrentUser(locale);
  const adminClient = createAdminClient();

  const { data: existingTalent, error: existingTalentError } = await adminClient
    .from("talents")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingTalentError) {
    throw new Error("[createOwnTalentProfileAction] " + existingTalentError.message);
  }
  if (existingTalent) redirect(`/${locale}/talent-dashboard/profile`);

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
    .select("id, slug, category_slug, city_slug, base_country_code")
    .maybeSingle();

  if (insertError || !createdTalent) {
    throw new Error(
      "[createOwnTalentProfileAction] " +
        (insertError?.message || "Failed to create talent profile."),
    );
  }

  if (
    !createdTalent.category_slug ||
    !createdTalent.city_slug ||
    createdTalent.base_country_code !== "SA"
  ) {
    throw new Error(
      "[createOwnTalentProfileAction] Talent profile was created, but market/category/city data was not saved correctly.",
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

  revalidatePath(`/${locale}/talent-dashboard`);
  revalidatePath(`/${locale}/talent-dashboard/profile`);
  redirect(`/${locale}/talent-dashboard/profile?created=1`);
}

export async function updateOwnTalentProfileAction(formData: FormData) {
  const locale: Locale = formData.get("locale") === "en" ? "en" : "ar";
  const user = await getCurrentUser(locale);
  const adminClient = createAdminClient();

  const [
    { data: talent, error: talentError },
    { data: profile, error: profileError },
  ] = await Promise.all([
    adminClient
      .from("talents")
      .select(`
        id,
        slug,
        nationality_slug,
        nationality,
        height_cm,
        weight_kg,
        shoe_size,
        chest_size,
        waist_size,
        hip_size
      `)
      .eq("user_id", user.id)
      .maybeSingle(),
    adminClient
      .from("profiles")
      .select(`id, phone`)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (talentError) {
    throw new Error("[updateOwnTalentProfileAction talent] " + talentError.message);
  }
  if (profileError) {
    throw new Error("[updateOwnTalentProfileAction profile] " + profileError.message);
  }
  if (!talent) throw new Error("No linked talent profile found.");
  if (!profile) throw new Error("No linked account profile found.");

  const nameEn = requiredStringValue(formData, "name_en");
  const nameAr = requiredStringValue(formData, "name_ar");
  const phone = nullableStringValue(formData, "phone");
  const sharedPayload = buildTalentSharedPayload(formData, talent);

  const talentPayload = {
    ...sharedPayload,
    name_en: nameEn,
    name_ar: nameAr,
    display_name_en: createDisplayName(nameEn),
    display_name_ar: createDisplayName(nameAr),
  };

  const { data: updatedTalent, error: updateError } = await adminClient
    .from("talents")
    .update(talentPayload)
    .eq("id", talent.id)
    .eq("user_id", user.id)
    .select("id, category_slug, city_slug, base_country_code")
    .maybeSingle();

  if (updateError || !updatedTalent) {
    throw new Error(
      "[updateOwnTalentProfileAction] " +
        (updateError?.message || "Failed to update talent profile."),
    );
  }

  if (
    !updatedTalent.category_slug ||
    !updatedTalent.city_slug ||
    updatedTalent.base_country_code !== "SA"
  ) {
    throw new Error(
      "[updateOwnTalentProfileAction] Talent profile was updated, but market/category/city data was not saved correctly.",
    );
  }

  const { error: profileUpdateError } = await adminClient
    .from("profiles")
    .update({ phone })
    .eq("id", profile.id)
    .eq("user_id", user.id);

  if (profileUpdateError) {
    throw new Error(
      "[updateOwnTalentProfileAction profile update] " + profileUpdateError.message,
    );
  }

  revalidatePath(`/${locale}/talent-dashboard`);
  revalidatePath(`/${locale}/talent-dashboard/profile`);
  revalidatePath("/admin/talents");

  if (talent.slug) {
    revalidatePath(`/ar/talent/${talent.slug}`);
    revalidatePath(`/en/talent/${talent.slug}`);
  }

  return {
    success: true,
    requiresResubmission: false,
    protectedChangePending: false,
  };
}
