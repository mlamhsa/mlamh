"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type UpdateTalentConsentResult = {
  success: boolean;
  message: string;
};

export async function updateOwnTalentConsentAction(
  locale: "ar" | "en" = "ar",
): Promise<UpdateTalentConsentResult> {
  const isArabic = locale === "ar";
  const authClient = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      message: isArabic
        ? "انتهت الجلسة. سجل الدخول مرة أخرى."
        : "Your session has expired. Please sign in again.",
    };
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, account_type, approval_status, data_accuracy_contact_consent")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !profile || profile.account_type !== "talent") {
    return {
      success: false,
      message: isArabic
        ? "تعذر العثور على ملف الموهبة."
        : "Talent profile could not be found.",
    };
  }

  if (profile.data_accuracy_contact_consent === true) {
    return {
      success: true,
      message: isArabic ? "تم تأكيد الموافقة مسبقًا." : "Consent is already confirmed.",
    };
  }

  const status = String(profile.approval_status ?? "not_submitted").trim().toLowerCase();
  if (!["not_submitted", "changes_requested", "rejected"].includes(status)) {
    return {
      success: false,
      message: isArabic
        ? "لا يمكن تغيير هذا الإقرار أثناء المراجعة."
        : "This consent cannot be changed while the profile is under review.",
    };
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({ data_accuracy_contact_consent: true })
    .eq("id", profile.id)
    .eq("user_id", user.id);

  if (updateError) {
    return {
      success: false,
      message: isArabic
        ? "تعذر حفظ الموافقة. حاول مرة أخرى."
        : "Unable to save consent. Please try again.",
    };
  }

  revalidatePath(`/${locale}/talent-dashboard`);
  revalidatePath(`/${locale}/talent-dashboard/profile`);
  revalidatePath(`/${locale}/talent-dashboard/profile/details`);

  return {
    success: true,
    message: isArabic ? "تم حفظ الموافقة بنجاح." : "Consent saved successfully.",
  };
}
