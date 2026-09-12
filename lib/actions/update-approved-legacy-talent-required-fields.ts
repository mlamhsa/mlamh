"use server";

import { revalidatePath } from "next/cache";

import { TALENT_CATEGORIES } from "@/lib/data/talent-categories";
import { GENDER_OPTIONS, NATIONALITY_OPTIONS } from "@/lib/data/talent-signup";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type UpdateApprovedLegacyRequiredFieldsResult = {
  success: boolean;
  message: string;
};

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function missing(value: unknown) {
  return value === null || value === undefined || (typeof value === "string" && value.trim() === "");
}

export async function updateApprovedLegacyTalentRequiredFieldsAction(
  formData: FormData,
): Promise<UpdateApprovedLegacyRequiredFieldsResult> {
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
      .select("id, primary_role, category_slug, gender, nationality, nationality_slug, date_of_birth")
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
      message: isArabic
        ? "هذا المسار مخصص فقط لاستكمال البيانات الناقصة في الملفات المعتمدة القديمة."
        : "This path is only for filling missing fields on approved legacy profiles.",
    };
  }

  const phone = text(formData, "phone");
  const role = text(formData, "primary_role");
  const gender = text(formData, "gender");
  const nationality = text(formData, "nationality_slug");
  const dateOfBirth = text(formData, "date_of_birth");

  const profilePayload: Record<string, unknown> = {};
  const talentPayload: Record<string, unknown> = {};

  // Approved legacy recovery is fill-only: never overwrite a value that already
  // exists on an approved profile, and never change approval state.
  if (missing(profile.phone) && phone) {
    profilePayload.phone = phone;
  }

  if (missing(talent.primary_role) && missing(talent.category_slug) && role) {
    const category = TALENT_CATEGORIES.find((item) => item.slug === role);
    if (!category) {
      return {
        success: false,
        message: isArabic ? "اختر نوع موهبة صحيحًا." : "Choose a valid talent type.",
      };
    }
    talentPayload.primary_role = category.slug;
    talentPayload.category_slug = category.slug;
    talentPayload.category_ar = category.ar;
    talentPayload.category_en = category.en;
  }

  if (missing(talent.gender) && gender) {
    if (!GENDER_OPTIONS.some((item) => item.value === gender)) {
      return {
        success: false,
        message: isArabic ? "اختر قيمة صحيحة للجنس." : "Choose a valid gender value.",
      };
    }
    talentPayload.gender = gender;
  }

  if (missing(talent.nationality_slug) && missing(talent.nationality) && nationality) {
    if (!NATIONALITY_OPTIONS.some((item) => item.value === nationality)) {
      return {
        success: false,
        message: isArabic ? "اختر جنسية صحيحة." : "Choose a valid nationality.",
      };
    }
    talentPayload.nationality_slug = nationality;
    talentPayload.nationality = nationality;
  }

  if (missing(talent.date_of_birth) && dateOfBirth) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
      return {
        success: false,
        message: isArabic ? "أدخل تاريخ ميلاد صحيحًا." : "Enter a valid date of birth.",
      };
    }
    const parsed = new Date(`${dateOfBirth}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime()) || parsed > new Date()) {
      return {
        success: false,
        message: isArabic ? "تحقق من تاريخ الميلاد." : "Check the date of birth.",
      };
    }
    talentPayload.date_of_birth = dateOfBirth;
  }

  if (Object.keys(talentPayload).length > 0) {
    const { error } = await admin
      .from("talents")
      .update(talentPayload)
      .eq("id", talent.id)
      .eq("user_id", user.id);
    if (error) {
      return {
        success: false,
        message: isArabic ? "تعذر حفظ البيانات الناقصة. حاول مرة أخرى." : "Unable to save the missing details. Please try again.",
      };
    }
  }

  if (Object.keys(profilePayload).length > 0) {
    const { error } = await admin
      .from("profiles")
      .update(profilePayload)
      .eq("id", profile.id)
      .eq("user_id", user.id);
    if (error) {
      return {
        success: false,
        message: isArabic ? "تم حفظ جزء من البيانات، لكن تعذر حفظ رقم الجوال." : "Some details were saved, but the phone number could not be saved.",
      };
    }
  }

  revalidatePath(`/${locale}/talent-dashboard`);
  revalidatePath(`/${locale}/talent-dashboard/profile`);
  revalidatePath(`/${locale}/talent-dashboard/profile/advanced`);
  revalidatePath(`/${locale}/talent-dashboard/profile/details`);

  return {
    success: true,
    message: isArabic
      ? "تم حفظ البيانات الناقصة مع بقاء اعتماد ملفك كما هو."
      : "Missing details saved. Your approval remains unchanged.",
  };
}