"use server";

import { revalidatePath } from "next/cache";

import { TALENT_CATEGORIES } from "@/lib/data/talent-categories";
import { GENDER_OPTIONS, NATIONALITY_OPTIONS, TALENT_SIGNUP_COUNTRIES } from "@/lib/data/talent-signup";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type UpdateTalentCoreDetailsResult = {
  success: boolean;
  message: string;
};

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalNumber(formData: FormData, key: string) {
  const value = text(formData, key);
  if (!value) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function list(formData: FormData, key: string) {
  return text(formData, key)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function booleanValue(formData: FormData, key: string) {
  return text(formData, key) === "true";
}

export async function updateOwnTalentCoreDetailsAction(
  formData: FormData,
): Promise<UpdateTalentCoreDetailsResult> {
  const locale = text(formData, "locale") === "en" ? "en" : "ar";
  const isArabic = locale === "ar";

  const authClient = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      message: isArabic ? "انتهت الجلسة. سجل الدخول مرة أخرى." : "Your session has expired. Please sign in again.",
    };
  }

  const admin = createAdminClient();
  const [{ data: profile, error: profileError }, { data: talent, error: talentError }] = await Promise.all([
    admin.from("profiles").select("id, approval_status, phone").eq("user_id", user.id).maybeSingle(),
    admin.from("talents").select("id, slug, primary_role, category_slug").eq("user_id", user.id).maybeSingle(),
  ]);

  if (profileError || talentError || !profile || !talent) {
    return { success: false, message: isArabic ? "تعذر العثور على ملف الموهبة." : "Talent profile could not be found." };
  }

  const editableStatuses = new Set(["not_submitted", "rejected", "changes_requested"]);
  const approvalStatus = String(profile.approval_status ?? "not_submitted");
  if (!editableStatuses.has(approvalStatus)) {
    return {
      success: false,
      message: isArabic
        ? "ملفك قيد المراجعة أو معتمد. تغييرات البيانات الأساسية تحتاج مسار مراجعة منفصل."
        : "Your profile is under review or approved. Core identity changes require a separate review flow.",
    };
  }

  const name = text(formData, "name");
  const phone = text(formData, "phone");
  const categorySlug = text(formData, "primary_role");
  const gender = text(formData, "gender");
  const nationality = text(formData, "nationality_slug");
  const countryCode = text(formData, "base_country_code").toUpperCase();
  const citySlug = text(formData, "city_slug");

  const category = categorySlug
    ? TALENT_CATEGORIES.find((item) => item.slug === categorySlug)
    : null;
  const genderOption = gender
    ? GENDER_OPTIONS.find((item) => item.value === gender)
    : null;
  const nationalityOption = nationality
    ? NATIONALITY_OPTIONS.find((item) => item.value === nationality)
    : null;
  const country = countryCode
    ? TALENT_SIGNUP_COUNTRIES.find((item) => item.code === countryCode)
    : null;
  const city = citySlug && country
    ? country.cities.find((item) => item.value === citySlug)
    : null;

  if (
    (categorySlug && !category) ||
    (gender && !genderOption) ||
    (nationality && !nationalityOption) ||
    (countryCode && !country) ||
    (citySlug && !city)
  ) {
    return {
      success: false,
      message: isArabic ? "إحدى القيم المختارة غير صحيحة. أعد اختيار البيانات." : "One of the selected values is invalid. Please choose again.",
    };
  }

  // Draft-safe behavior: core fields are hard gates for review submission, not
  // hard gates for saving. Preserve anything the talent has already entered and
  // allow the remaining required fields to be completed over multiple visits.
  const talentPayload: Record<string, unknown> = {};

  if (name) {
    talentPayload.name_ar = name;
    talentPayload.name_en = name;
  }
  if (category) {
    talentPayload.category_slug = category.slug;
    talentPayload.category_ar = category.ar;
    talentPayload.category_en = category.en;
    talentPayload.primary_role = category.slug;
  }
  if (gender) talentPayload.gender = gender;
  if (nationality) {
    talentPayload.nationality_slug = nationality;
    talentPayload.nationality = nationality;
  }
  if (country) talentPayload.base_country_code = country.code;
  if (city) {
    talentPayload.city_slug = city.value;
    talentPayload.city_ar = city.ar;
    talentPayload.city_en = city.en;
  }

  // Shared optional matching signals. These existed in the legacy profile and are
  // intentionally kept outside approval readiness.
  if (formData.has("availability_status")) {
    talentPayload.availability_status = text(formData, "availability_status") || "available_now";
  }
  for (const key of ["ready_to_travel", "has_passport", "has_car", "work_outside_city", "work_outside_country"] as const) {
    if (formData.has(key)) talentPayload[key] = booleanValue(formData, key);
  }

  const effectiveRole = category?.slug ?? String(talent.primary_role ?? talent.category_slug ?? "").trim();

  // Role-specific fields improve profile strength and matching only.
  if (effectiveRole === "actor") {
    const actingAgeMin = optionalNumber(formData, "acting_age_min");
    const actingAgeMax = optionalNumber(formData, "acting_age_max");

    if (actingAgeMin !== null && actingAgeMax !== null && actingAgeMin > actingAgeMax) {
      return {
        success: false,
        message: isArabic
          ? "العمر التمثيلي الأدنى يجب أن يكون أقل من أو يساوي الأعلى."
          : "Minimum playing age must be less than or equal to maximum playing age.",
      };
    }

    if (formData.has("acting_age_min")) talentPayload.acting_age_min = actingAgeMin;
    if (formData.has("acting_age_max")) talentPayload.acting_age_max = actingAgeMax;
    if (formData.has("experience_years")) talentPayload.experience_years = optionalNumber(formData, "experience_years");
    if (formData.has("languages")) talentPayload.languages = list(formData, "languages");
    if (formData.has("dialects")) talentPayload.dialects = list(formData, "dialects");
    if (formData.has("skills")) talentPayload.skills = list(formData, "skills");
    if (formData.has("height_cm")) talentPayload.height_cm = optionalNumber(formData, "height_cm");
    if (formData.has("weight_kg")) talentPayload.weight_kg = optionalNumber(formData, "weight_kg");
    if (formData.has("eye_color")) talentPayload.eye_color = text(formData, "eye_color") || null;
    if (formData.has("hair_color")) talentPayload.hair_color = text(formData, "hair_color") || null;
    if (formData.has("hair_type")) talentPayload.hair_type = text(formData, "hair_type") || null;
    if (formData.has("skin_color")) talentPayload.skin_color = text(formData, "skin_color") || null;
  }

  if (effectiveRole === "model") {
    if (formData.has("height_cm")) talentPayload.height_cm = optionalNumber(formData, "height_cm");
    if (formData.has("weight_kg")) talentPayload.weight_kg = optionalNumber(formData, "weight_kg");
    if (formData.has("clothing_size")) talentPayload.clothing_size = text(formData, "clothing_size") || null;
    if (formData.has("shoe_size")) talentPayload.shoe_size = optionalNumber(formData, "shoe_size");
    if (formData.has("chest_size")) talentPayload.chest_size = optionalNumber(formData, "chest_size");
    if (formData.has("waist_size")) talentPayload.waist_size = optionalNumber(formData, "waist_size");
    if (formData.has("hip_size")) talentPayload.hip_size = optionalNumber(formData, "hip_size");
    if (formData.has("eye_color")) talentPayload.eye_color = text(formData, "eye_color") || null;
    if (formData.has("hair_color")) talentPayload.hair_color = text(formData, "hair_color") || null;
    if (formData.has("hair_type")) talentPayload.hair_type = text(formData, "hair_type") || null;
    if (formData.has("skin_color")) talentPayload.skin_color = text(formData, "skin_color") || null;
    if (formData.has("modeling_types")) talentPayload.modeling_types = list(formData, "modeling_types");
  }

  if (Object.keys(talentPayload).length > 0) {
    const { error: updateTalentError } = await admin
      .from("talents")
      .update(talentPayload)
      .eq("id", talent.id)
      .eq("user_id", user.id);

    if (updateTalentError) {
      return {
        success: false,
        message: isArabic ? "تعذر حفظ بيانات الموهبة. حاول مرة أخرى." : "Unable to save talent details. Please try again.",
      };
    }
  }

  if (phone && phone !== String(profile.phone ?? "").trim()) {
    const { error: updateProfileError } = await admin
      .from("profiles")
      .update({ phone })
      .eq("id", profile.id)
      .eq("user_id", user.id);

    if (updateProfileError) {
      return {
        success: false,
        message: isArabic
          ? "تم حفظ جزء من البيانات، لكن تعذر تحديث رقم الجوال. حاول مرة أخرى."
          : "Some details were saved, but the phone number could not be updated. Please try again.",
      };
    }
  }

  revalidatePath(`/${locale}/talent-dashboard`);
  revalidatePath(`/${locale}/talent-dashboard/profile`);
  revalidatePath(`/${locale}/talent-dashboard/profile/details`);

  if (talent.slug) {
    revalidatePath(`/ar/talent/${encodeURIComponent(talent.slug)}`);
    revalidatePath(`/en/talent/${encodeURIComponent(talent.slug)}`);
  }

  return { success: true, message: isArabic ? "تم حفظ بياناتك بنجاح." : "Your details were saved successfully." };
}
