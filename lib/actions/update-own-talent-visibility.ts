"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { syncApprovedTalentReadiness } from "@/lib/talent/sync-approved-talent-readiness";

export type TalentVisibility = "public" | "private";

export type UpdateTalentVisibilityResult = {
  success: boolean;
  visibility?: TalentVisibility;
  message: string;
};

async function getAuthenticatedUser() {
  const authClient = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();

  if (error || !user) return null;
  return user;
}

export async function getOwnTalentVisibilityAction(): Promise<TalentVisibility | null> {
  const user = await getAuthenticatedUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("talents")
    .select("profile_visibility")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[getOwnTalentVisibilityAction]", error);
    return null;
  }

  const visibility = String(data?.profile_visibility ?? "").trim().toLowerCase();
  return visibility === "private" ? "private" : visibility === "public" ? "public" : null;
}

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

  const user = await getAuthenticatedUser();

  if (!user) {
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

  if (profile.approval_status === "pending" || profile.approval_status === "submitted") {
    return {
      success: false,
      message:
        locale === "ar"
          ? "لا يمكن تغيير طريقة ظهور الملف أثناء المراجعة."
          : "Profile visibility cannot be changed while the profile is under review.",
    };
  }

  // Fail closed first. Readiness sync below republishes an approved public profile
  // only when every current hard gate is complete.
  const { error: updateError } = await admin
    .from("talents")
    .update({
      profile_visibility: visibility,
      published: false,
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

  let readiness;
  try {
    readiness = await syncApprovedTalentReadiness(user.id);
  } catch (error) {
    console.error("[updateOwnTalentVisibilityAction:readiness]", error);
    return {
      success: false,
      message:
        locale === "ar"
          ? "تم حفظ خيار الظهور، لكن تعذر تحديث جاهزية الملف. حاول مرة أخرى."
          : "Visibility was saved, but profile readiness could not be refreshed. Please try again.",
    };
  }

  const approved = profile.approval_status === "approved";
  const ready = readiness?.isReady === true;

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
            ? ready
              ? "تم حفظ الخيار. ملفك العام متاح للظهور في دليل المواهب."
              : "تم حفظ الخيار. ملفك معتمد، وسيظهر في الدليل تلقائيًا بعد إكمال المتطلبات الأساسية."
            : "تم حفظ الخيار. سيظهر ملفك في الدليل العام بعد الاعتماد."
          : ready
            ? "تم حفظ الخيار. ملفك خاص ولن يظهر في الدليل العام، وسيبقى متاحًا للمطابقة الخاصة."
            : "تم حفظ الخيار. ملفك خاص، وستعود المطابقة تلقائيًا بعد إكمال المتطلبات الأساسية."
        : visibility === "public"
          ? approved
            ? ready
              ? "Saved. Your public profile can appear in the talent directory."
              : "Saved. Your profile is approved and will appear automatically after you complete the core requirements."
            : "Saved. Your profile can appear publicly after approval."
          : ready
            ? "Saved. Your profile is private and hidden from the public directory while remaining eligible for private matching."
            : "Saved. Your profile is private; matching will resume automatically after you complete the core requirements.",
  };
}
