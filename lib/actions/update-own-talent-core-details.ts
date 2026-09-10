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
    return { success: false, message: isArabic ? "انتهت الجلسة. سجل الدخول مرة أخرى." : "Your session has expired. Please sign in again." };
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
    return { success: false, message: isArabic ? "أكمل جميع البيانات الأساسية قبل الحفظ." : "Complete all required core details before saving." };
  }

  const category = TALENT_CATEGORIES.find((item) => item.slug === categorySlug);
  const genderOption = GENDER_OPTIONS.find((item) => item.value === gender);
  const nationalityOption = NATIONALITY_OPTIONS.find((item) => item.value === nationality);
  const country = TALENT_SIGNUP_COUNTRIES.find((item) => item.code === countryCode);
  const city = country?.cities.find((item) => item.value === citySlug);

  if (!category || !genderOption || !nationalityOption || !country || !city) {
    return { success: false, message: isArabic ? "إحدى القيم المختارة غير صحيحة. أعد اختيار البيانات." : "One of the selected values is invalid. Please choose again." };
  }

  const { error: updateTalentError } = await admin
    .from("talents")
    .update({
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
    })
    .eq("id", talent.id)
    .eq("user_id", user.id);

  if (updateTalentError) {
    return { success: false, message: isArabic ? "تعذر حفظ بيانات الموهبة. حاول مرة أخرى." : "Unable to save talent details. Please try again." };
  }

  const { error: updateProfileError } = await admin
    .from("profiles")
    .update({ phone })
    .eq("id", profile.id)
    .eq("user_id", user.id);

  if (updateProfileError) {
    return { success: false, message: isArabic ? "تم حفظ جزء من البيانات، لكن تعذر تحديث رقم الجوال. حاول مرة أخرى." : "Some details were saved, but the phone number could not be updated. Please try again." };
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
