"use server";

import { revalidatePath } from "next/cache";

import { NATIONALITY_OPTIONS } from "@/lib/data/talent-signup";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type RequestTalentProfileChangeResult = {
  success: boolean;
  message: string;
};

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function requestOwnTalentProfileChangeAction(
  formData: FormData,
): Promise<RequestTalentProfileChangeResult> {
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
    admin
      .from("profiles")
      .select("id, account_type, approval_status, phone")
      .eq("user_id", user.id)
      .maybeSingle(),
    admin
      .from("talents")
      .select("id, name_ar, name_en, nationality_slug, nationality")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (profileError || talentError || !profile || !talent || profile.account_type !== "talent") {
    return {
      success: false,
      message: isArabic ? "تعذر العثور على ملف الموهبة." : "Talent profile could not be found.",
    };
  }

  if (String(profile.approval_status ?? "").trim().toLowerCase() !== "approved") {
    return {
      success: false,
      message: isArabic ? "طلبات تعديل البيانات المحمية متاحة للملفات المعتمدة فقط." : "Protected profile change requests are available only for approved profiles.",
    };
  }

  const { data: pendingRequest, error: pendingError } = await admin
    .from("talent_profile_change_requests")
    .select("id")
    .eq("talent_id", talent.id)
    .eq("status", "pending")
    .maybeSingle();

  if (pendingError) {
    return {
      success: false,
      message: isArabic ? "تعذر التحقق من طلبات التعديل الحالية." : "Unable to check existing change requests.",
    };
  }

  if (pendingRequest) {
    return {
      success: false,
      message: isArabic ? "لديك طلب تعديل قيد المراجعة بالفعل." : "You already have a profile change request under review.",
    };
  }

  const requestedName = text(formData, "name");
  const requestedPhone = text(formData, "phone");
  const requestedNationality = text(formData, "nationality_slug");

  if (requestedNationality && !NATIONALITY_OPTIONS.some((item) => item.value === requestedNationality)) {
    return {
      success: false,
      message: isArabic ? "اختر جنسية صحيحة." : "Choose a valid nationality.",
    };
  }

  const currentNameAr = String(talent.name_ar ?? "").trim();
  const currentNameEn = String(talent.name_en ?? "").trim();
  const currentPhone = String(profile.phone ?? "").trim();
  const currentNationality = String(talent.nationality_slug ?? talent.nationality ?? "").trim();

  const nameChanged = Boolean(requestedName) && requestedName !== currentNameAr && requestedName !== currentNameEn;
  const phoneChanged = Boolean(requestedPhone) && requestedPhone !== currentPhone;
  const nationalityChanged = Boolean(requestedNationality) && requestedNationality !== currentNationality;

  if (!nameChanged && !phoneChanged && !nationalityChanged) {
    return {
      success: false,
      message: isArabic ? "لم تغيّر أي بيانات محمية." : "No protected profile details were changed.",
    };
  }

  const { error: insertError } = await admin
    .from("talent_profile_change_requests")
    .insert({
      user_id: user.id,
      talent_id: talent.id,
      requested_name_ar: nameChanged ? requestedName : null,
      requested_name_en: nameChanged ? requestedName : null,
      requested_phone: phoneChanged ? requestedPhone : null,
      requested_nationality_slug: nationalityChanged ? requestedNationality : null,
      status: "pending",
    });

  if (insertError) {
    console.error("[requestOwnTalentProfileChangeAction]", insertError.message);
    return {
      success: false,
      message: isArabic ? "تعذر إرسال طلب التعديل الآن. حاول مرة أخرى." : "Unable to submit the change request right now. Please try again.",
    };
  }

  revalidatePath(`/${locale}/talent-dashboard`);
  revalidatePath(`/${locale}/talent-dashboard/profile`);
  revalidatePath(`/${locale}/talent-dashboard/profile/advanced`);
  revalidatePath("/admin/talents");
  revalidatePath(`/admin/talents/${talent.id}`);

  return {
    success: true,
    message: isArabic ? "تم إرسال طلب تعديل البيانات للمراجعة مع بقاء اعتماد ملفك كما هو." : "Your profile change request was submitted for review. Your approval remains unchanged.",
  };
}
