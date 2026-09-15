"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type UpdateTalentProfileVisibilityResult = {
  success: boolean;
  message: string;
};

export async function updateOwnTalentProfileVisibilityAction(
  formData: FormData,
): Promise<UpdateTalentProfileVisibilityResult> {
  const locale = formData.get("locale") === "en" ? "en" : "ar";
  const isArabic = locale === "ar";
  const visibility = String(formData.get("profile_visibility") ?? "").trim().toLowerCase();

  if (visibility !== "public" && visibility !== "private") {
    return {
      success: false,
      message: isArabic ? "اختر طريقة ظهور الملف." : "Choose your profile visibility.",
    };
  }

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
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (talentError || !talent) {
    return {
      success: false,
      message: isArabic ? "تعذر العثور على ملف الموهبة." : "Talent profile could not be found.",
    };
  }

  const { error: updateError } = await admin
    .from("talents")
    .update({ profile_visibility: visibility })
    .eq("id", talent.id)
    .eq("user_id", user.id);

  if (updateError) {
    return {
      success: false,
      message: isArabic ? "تعذر حفظ إعداد الظهور. حاول مرة أخرى." : "Unable to save visibility. Please try again.",
    };
  }

  revalidatePath(`/${locale}/talent-dashboard/profile`);
  revalidatePath(`/${locale}/talent-dashboard/profile/privacy`);
  revalidatePath(`/${locale}/talent-dashboard`);

  return {
    success: true,
    message: isArabic ? "تم تحديث ظهور الملف." : "Profile visibility updated.",
  };
}
