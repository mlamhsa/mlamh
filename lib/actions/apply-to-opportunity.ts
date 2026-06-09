"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ApplyResult = {
  status: "success" | "already_applied" | "unauthorized" | "not_talent" | "error";
  message: string;
};

export async function applyToOpportunityAction(
  _prevState: ApplyResult | null,
  formData: FormData
): Promise<ApplyResult> {
  const opportunityId = Number(formData.get("opportunity_id"));
  const locale = String(formData.get("locale") || "ar");
  const slug = String(formData.get("slug") || "");

  if (!opportunityId) {
    return {
      status: "error",
      message: locale === "ar" ? "بيانات الفرصة غير صحيحة." : "Invalid opportunity.",
    };
  }

  const authClient = await createServerSupabaseClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return {
      status: "unauthorized",
      message: locale === "ar" ? "يرجى تسجيل الدخول أولاً." : "Please login first.",
    };
  }

  const { data: profile } = await adminClient
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  let talent = null;

  if (profile) {
    const { data } = await adminClient
      .from("talents")
      .select("id")
      .eq("profile_id", profile.id)
      .maybeSingle();

    talent = data;
  }

  if (!talent) {
    const { data } = await adminClient
      .from("talents")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    talent = data;
  }

  if (!talent) {
    return {
      status: "not_talent",
      message:
        locale === "ar"
          ? "يجب إكمال ملف الموهبة قبل التقديم."
          : "Please complete your talent profile before applying.",
    };
  }

  const { data: existingApplication } = await adminClient
    .from("opportunity_applications")
    .select("id, status")
    .eq("opportunity_id", opportunityId)
    .eq("talent_id", talent.id)
    .maybeSingle();

  if (existingApplication) {
    return {
      status: "already_applied",
      message:
        locale === "ar"
          ? "لقد قدمت على هذه الفرصة مسبقاً."
          : "You have already applied to this opportunity.",
    };
  }

  const { error } = await adminClient.from("opportunity_applications").insert({
    opportunity_id: opportunityId,
    talent_id: talent.id,
    status: "pending",
  });

  if (error) {
    return {
      status: "error",
      message:
        locale === "ar"
          ? "حدث خطأ أثناء التقديم. حاول مرة أخرى."
          : "Something went wrong while applying. Please try again.",
    };
  }

  revalidatePath(`/${locale}/opportunities/${slug}`);
  revalidatePath(`/${locale}/talent-dashboard/applications`);
  revalidatePath(`/${locale}/talent-dashboard`);

  return {
    status: "success",
    message:
      locale === "ar"
        ? "تم تقديم طلبك بنجاح."
        : "Your application has been submitted successfully.",
  };
}