"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ApplyResult = {
  status:
    | "success"
    | "already_applied"
    | "unauthorized"
    | "not_talent"
    | "error";
  message: string;
};

export async function applyToOpportunityAction(
  _prevState: ApplyResult | null,
  formData: FormData,
): Promise<ApplyResult> {
  const opportunityId = Number(formData.get("opportunity_id"));
  const locale = formData.get("locale") === "en" ? "en" : "ar";

  if (
    !Number.isInteger(opportunityId) ||
    opportunityId <= 0
  ) {
    return {
      status: "error",
      message:
        locale === "ar"
          ? "بيانات الفرصة غير صحيحة."
          : "Invalid opportunity.",
    };
  }

  const authClient = await createServerSupabaseClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    return {
      status: "unauthorized",
      message:
        locale === "ar"
          ? "يرجى تسجيل الدخول أولاً."
          : "Please login first.",
    };
  }

  const { data: profile, error: profileError } =
    await adminClient
      .from("profiles")
      .select("id, account_type")
      .eq("user_id", user.id)
      .maybeSingle();

  if (profileError) {
    console.error(
      "Apply opportunity profile lookup error:",
      profileError,
    );

    return {
      status: "error",
      message:
        locale === "ar"
          ? "تعذر التحقق من الحساب. حاول مرة أخرى."
          : "Unable to verify your account. Please try again.",
    };
  }

  if (!profile || profile.account_type !== "talent") {
    return {
      status: "not_talent",
      message:
        locale === "ar"
          ? "يجب إكمال ملف الموهبة قبل التقديم."
          : "Please complete your talent profile before applying.",
    };
  }

  const { data: talent, error: talentError } =
    await adminClient
      .from("talents")
      .select("id")
      .eq("profile_id", profile.id)
      .maybeSingle();

  if (talentError) {
    console.error(
      "Apply opportunity talent lookup error:",
      talentError,
    );

    return {
      status: "error",
      message:
        locale === "ar"
          ? "تعذر التحقق من ملف الموهبة."
          : "Unable to verify your talent profile.",
    };
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

  const { data: opportunity, error: opportunityError } =
    await adminClient
      .from("opportunities")
      .select("id, slug, status, published")
      .eq("id", opportunityId)
      .maybeSingle();

  if (opportunityError) {
    console.error(
      "Apply opportunity lookup error:",
      opportunityError,
    );

    return {
      status: "error",
      message:
        locale === "ar"
          ? "تعذر تحميل بيانات الفرصة."
          : "Unable to load the opportunity.",
    };
  }

  const isAvailable =
    opportunity &&
    opportunity.published === true &&
    (opportunity.status === "open" ||
      opportunity.status === "published");

  if (!isAvailable) {
    return {
      status: "error",
      message:
        locale === "ar"
          ? "هذه الفرصة غير متاحة للتقديم حاليًا."
          : "This opportunity is not currently open for applications.",
    };
  }

  const {
    data: existingApplication,
    error: existingApplicationError,
  } = await adminClient
    .from("opportunity_applications")
    .select("id")
    .eq("opportunity_id", opportunity.id)
    .eq("talent_id", talent.id)
    .maybeSingle();

  if (existingApplicationError) {
    console.error(
      "Existing application lookup error:",
      existingApplicationError,
    );

    return {
      status: "error",
      message:
        locale === "ar"
          ? "تعذر التحقق من حالة الطلب."
          : "Unable to verify your application status.",
    };
  }

  if (existingApplication) {
    return {
      status: "already_applied",
      message:
        locale === "ar"
          ? "لقد قدمت على هذه الفرصة مسبقًا."
          : "You have already applied to this opportunity.",
    };
  }

  const { error: insertError } = await adminClient
    .from("opportunity_applications")
    .insert({
      opportunity_id: opportunity.id,
      talent_id: talent.id,
      status: "pending",
    });

  if (insertError) {
    /*
     * PostgreSQL code 23505 means a unique constraint was hit.
     * This safely handles two submissions arriving together.
     */
    if (insertError.code === "23505") {
      return {
        status: "already_applied",
        message:
          locale === "ar"
            ? "لقد قدمت على هذه الفرصة مسبقًا."
            : "You have already applied to this opportunity.",
      };
    }

    console.error(
      "Apply opportunity insert error:",
      insertError,
    );

    return {
      status: "error",
      message:
        locale === "ar"
          ? "حدث خطأ أثناء التقديم. حاول مرة أخرى."
          : "Something went wrong while applying. Please try again.",
    };
  }

  revalidatePath(
    `/${locale}/opportunities/${opportunity.slug}`,
  );
  revalidatePath(
    `/${locale}/talent-dashboard/applications`,
  );
  revalidatePath(`/${locale}/talent-dashboard`);

  return {
    status: "success",
    message:
      locale === "ar"
        ? "تم تقديم طلبك بنجاح."
        : "Your application has been submitted successfully.",
  };
}