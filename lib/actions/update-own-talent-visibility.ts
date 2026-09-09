"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type TalentVisibility = "public" | "private";

export type UpdateTalentVisibilityResult = {
  success: boolean;
  visibility?: TalentVisibility;
  message: string;
};

export async function updateOwnTalentVisibilityAction(
  visibility: TalentVisibility,
  locale: "ar" | "en",
): Promise<UpdateTalentVisibilityResult> {
  if (visibility !== "public" && visibility !== "private") {
    return {
      success: false,
      message: locale === "ar" ? "خيار الظهور غير صالح." : "Invalid visibility option.",
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
      message: locale === "ar" ? "انتهت الجلسة. سجّل الدخول مرة أخرى." : "Your session expired. Please sign in again.",
    };
  }

  const admin = createAdminClient();
  const [{ data: talent, error: talentError }, { data: profile, error: profileError }] =
    await Promise.all([
      admin
        .from("talents")
        .select("id, slug, profile_visibility, published")
        .eq("user_id", user.id)
        .maybeSingle(),
      admin
        .from("profiles")
        .select("approval_status")
        .eq("user_id", user.id)
        .eq("account_type", "talent")
        .maybeSingle(),
    ]);

  if (talentError || profileError || !talent || !profile) {
    console.error("[updateOwnTalentVisibilityAction]", { talentError, profileError });
    return {
      success: false,
      message: locale === "ar" ? "تعذر تحديث خصوصية الملف حاليًا." : "Unable to update profile visibility right now.",
    };
  }

  const approved = profile.approval_status === "approved";
  const nextPublished = approved && visibility === "public";

  const { error: updateError } = await admin
    .from("talents")
    .update({
      profile_visibility: visibility,
      published: nextPublished,
    })
    .eq("id", talent.id)
    .eq("user_id", user.id);

  if (updateError) {
    console.error("[updateOwnTalentVisibilityAction:update]", updateError);
    return {
      success: false,
      message: locale === "ar" ? "تعذر حفظ خيار الظهور." : "Unable to save visibility.",
    };
  }

  revalidatePath(`/${locale}/talent-dashboard`);
  revalidatePath(`/${locale}/talent-dashboard/profile`);
  revalidatePath(`/${locale}/talent`);
  revalidatePath("/admin/talents");
  revalidatePath(`/admin/talents/${talent.id}`);

  if (talent.slug) {
    const slug = encodeURIComponent(talent.slug);
    revalidatePath(`/ar/talent/${slug}`);
    revalidatePath(`/en/talent/${slug}`);
  }

  return {
    success: true,
    visibility,
    message:
      locale === "ar"
        ? visibility === "public"
          ? approved
            ? "تم حفظ الخيار. ملفك العام متاح للظهور في دليل المواهب."
            : "تم حفظ الخيار. سيظهر ملفك في الدليل العام بعد الاعتماد."
          : "تم حفظ الخيار. ملفك خاص ولن يظهر في دليل المواهب العام، وسيبقى متاحًا للمطابقة الخاصة."
        : visibility === "public"
          ? approved
            ? "Saved. Your public profile can appear in the talent directory."
            : "Saved. Your profile can appear publicly after approval."
          : "Saved. Your profile is private and hidden from the public directory while remaining eligible for private matching.",
  };
}
