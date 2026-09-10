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
    admin.from("profiles").select("id, approval_status").eq("user_id", user.id).maybeSingle(),
    admin.from("talents").select("id, slug").eq("user_id", user.id).maybeSingle(),
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

  if (!name || !phone || !categorySlug || !gender || !nationality || !countryCode || !citySlug) {
    return {
      success: false,
      message: isArabic ? "أكمل جميع البيانات الأساسية قبل الحفظ." : "Complete all required core details before saving.",
    };
  }

  const category = TALENT_CATEGORIES.find((item) => item.slug === categorySlug);
  const genderOption = GENDER_OPTIONS.find((item) => item.value === gender);
  const nationalityOption = NATIONALITY_OPTIONS.find((item) => item.value === nationality);
  const country = TALENT_SIGNUP_COUNTRIES.find((item) => item.code === countryCode);
  const city = country?.cities.find((item) => item.value === citySlug);

  if (!category || !genderOption || !nationalityOption || !country || !city) {
    return {
      success: false,
      message: isArabic ? "إحدى القيم المختارة غير صحيحة. أعد اختيار البيانات." : "One of the selected values is invalid. Please choose again.",
    };
  }

  const talentPayload: Record<string, unknown> = {
    name_ar: name,
    name_en: name,
    category_slug: category.slug,
    category_ar: category.ar,
    category_en: category.en,
    primary_role: category.slug,
    gender,
    nationality_slug: nationality,
    nationality,
    base_country_code: country.code,
    city_slug: city.value,
    city_ar: city.ar,
    city_en: city.en,
  };

  // Role-specific fields improve profile strength and matching only.
  if (categorySlug === "actor") {
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

    talentPayload.acting_age_min = actingAgeMin;
    talentPayload.acting_age_max = actingAgeMax;
    talentPayload.experience_years = optionalNumber(formData, "experience_years");
    talentPayload.languages = list(formData, "languages");
    talentPayload.dialects = list(formData, "dialects");
    talentPayload.skills = list(formData, "skills");
    talentPayload.height_cm = optionalNumber(formData, "height_cm");
    talentPayload.weight_kg = optionalNumber(formData, "weight_kg");
    talentPayload.eye_color = text(formData, "eye_color") || null;
    talentPayload.hair_color = text(formData, "hair_color") || null;
  }

  if (categorySlug === "model") {
    talentPayload.height_cm = optionalNumber(formData, "height_cm");
    talentPayload.weight_kg = optionalNumber(formData, "weight_kg");
    talentPayload.clothing_size = text(formData, "clothing_size") || null;
    talentPayload.shoe_size = optionalNumber(formData, "shoe_size");
    talentPayload.chest_size = optionalNumber(formData, "chest_size");
    talentPayload.waist_size = optionalNumber(formData, "waist_size");
    talentPayload.hip_size = optionalNumber(formData, "hip_size");
    talentPayload.eye_color = text(formData, "eye_color") || null;
    talentPayload.hair_color = text(formData, "hair_color") || null;
    talentPayload.modeling_types = list(formData, "modeling_types");
  }

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

  revalidatePath(`/${locale}/talent-dashboard`);
  revalidatePath(`/${locale}/talent-dashboard/profile`);
  revalidatePath(`/${locale}/talent-dashboard/profile/details`);

  if (talent.slug) {
    revalidatePath(`/ar/talent/${encodeURIComponent(talent.slug)}`);
    revalidatePath(`/en/talent/${encodeURIComponent(talent.slug)}`);
  }

  return { success: true, message: isArabic ? "تم حفظ بياناتك بنجاح." : "Your details were saved successfully." };
}
