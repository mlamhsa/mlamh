"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type UpdateTalentProfessionalDetailsResult = {
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

export async function updateOwnTalentProfessionalDetailsAction(
  formData: FormData,
): Promise<UpdateTalentProfessionalDetailsResult> {
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
  const { data: talent, error: talentError } = await admin
    .from("talents")
    .select("id, slug, primary_role, category_slug")
    .eq("user_id", user.id)
    .maybeSingle();

  if (talentError || !talent) {
    return {
      success: false,
      message: isArabic ? "تعذر العثور على ملف الموهبة." : "Talent profile could not be found.",
    };
  }

  const role = String(talent.primary_role || talent.category_slug || "").trim().toLowerCase();
  const payload: Record<string, unknown> = {};

  if (formData.has("availability_status")) {
    payload.availability_status = text(formData, "availability_status") || "available_now";
  }

  for (const key of ["ready_to_travel", "has_passport", "has_car", "work_outside_city", "work_outside_country"] as const) {
    if (formData.has(key)) payload[key] = booleanValue(formData, key);
  }

  if (role === "actor") {
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

    payload.acting_age_min = actingAgeMin;
    payload.acting_age_max = actingAgeMax;
    payload.experience_years = optionalNumber(formData, "experience_years");
    payload.languages = list(formData, "languages");
    payload.dialects = list(formData, "dialects");
    payload.skills = list(formData, "skills");
    payload.height_cm = optionalNumber(formData, "height_cm");
    payload.weight_kg = optionalNumber(formData, "weight_kg");
    payload.eye_color = text(formData, "eye_color") || null;
    payload.hair_color = text(formData, "hair_color") || null;
    payload.hair_type = text(formData, "hair_type") || null;
    payload.skin_color = text(formData, "skin_color") || null;
  }

  if (role === "model") {
    payload.height_cm = optionalNumber(formData, "height_cm");
    payload.weight_kg = optionalNumber(formData, "weight_kg");
    payload.clothing_size = text(formData, "clothing_size") || null;
    payload.shoe_size = optionalNumber(formData, "shoe_size");
    payload.chest_size = optionalNumber(formData, "chest_size");
    payload.waist_size = optionalNumber(formData, "waist_size");
    payload.hip_size = optionalNumber(formData, "hip_size");
    payload.eye_color = text(formData, "eye_color") || null;
    payload.hair_color = text(formData, "hair_color") || null;
    payload.hair_type = text(formData, "hair_type") || null;
    payload.skin_color = text(formData, "skin_color") || null;
    payload.modeling_types = list(formData, "modeling_types");
  }

  if (Object.keys(payload).length === 0) {
    return {
      success: false,
      message: isArabic ? "لا توجد بيانات مهنية لحفظها." : "There are no professional details to save.",
    };
  }

  const { error: updateError } = await admin
    .from("talents")
    .update(payload)
    .eq("id", talent.id)
    .eq("user_id", user.id);

  if (updateError) {
    return {
      success: false,
      message: isArabic ? "تعذر حفظ البيانات المهنية. حاول مرة أخرى." : "Unable to save professional details. Please try again.",
    };
  }

  revalidatePath(`/${locale}/talent-dashboard`);
  revalidatePath(`/${locale}/talent-dashboard/profile`);
  revalidatePath(`/${locale}/talent-dashboard/profile/details`);

  if (talent.slug) {
    revalidatePath(`/ar/talent/${encodeURIComponent(talent.slug)}`);
    revalidatePath(`/en/talent/${encodeURIComponent(talent.slug)}`);
  }

  return {
    success: true,
    message: isArabic ? "تم حفظ تحسينات ملفك المهني." : "Your professional profile improvements were saved.",
  };
}
