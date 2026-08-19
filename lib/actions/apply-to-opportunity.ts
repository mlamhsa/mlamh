"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getTalentProfileReadiness } from "@/lib/talent/profile-review-readiness";

export type ApplyResult = {
  status:
    | "success"
    | "already_applied"
    | "unauthorized"
    | "not_talent"
    | "error";
  message: string;
};

const RESTRICTED_ACCOUNT_STATUSES = new Set([
  "suspended",
  "blocked",
  "banned",
  "disabled",
]);

export async function applyToOpportunityAction(
  _prevState: ApplyResult | null,
  formData: FormData,
): Promise<ApplyResult> {
  const opportunityId = Number(
    formData.get("opportunity_id"),
  );

  const locale =
    formData.get("locale") === "en"
      ? "en"
      : "ar";

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

  const authClient =
    await createServerSupabaseClient();
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

  const {
    data: profile,
    error: profileError,
  } = await adminClient
  .from("profiles")
.select("account_type, status, approval_status, phone")
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

  if (
    !profile ||
    profile.account_type !== "talent"
  ) {
    return {
      status: "not_talent",
      message:
        locale === "ar"
          ? "يجب إنشاء ملف موهبة قبل التقديم."
          : "Please create your talent profile before applying.",
    };
  }

  if (
    RESTRICTED_ACCOUNT_STATUSES.has(
      profile.status ?? "",
    )
  ) {
    return {
      status: "unauthorized",
      message:
        locale === "ar"
          ? "هذا الحساب غير متاح للتقديم حاليًا."
          : "This account is not currently allowed to apply.",
    };
  }

  if (profile.approval_status !== "approved") {
    return {
      status: "unauthorized",
      message:
        locale === "ar"
          ? "يجب اعتماد ملف الموهبة من الإدارة قبل التقديم على الفرص."
          : "Your talent profile must be approved before applying to opportunities.",
    };
  }

  const {
    data: talent,
    error: talentError,
  } = await adminClient
    .from("talents")
    .select(`
      id,
      name_ar,
      name_en,
      image_url,
      primary_role,
      city_slug,
      gender,
      nationality,
      nationality_slug,
      date_of_birth,
      bio_ar,
      bio_en,
      height_cm,
      acting_age_min,
      acting_age_max,
      modeling_types
    `)
    .eq("user_id", user.id)
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
          ? "يجب إنشاء ملف موهبة قبل التقديم."
          : "Please create your talent profile before applying.",
    };
  }

  const profileReadiness =
  getTalentProfileReadiness({
    ...talent,
    phone: profile.phone,
  });

  if (!profileReadiness.isReady) {
    console.log(
      "[Talent profile readiness]",
      {
        talentId: talent.id,
        primaryRole: talent.primary_role,
        missingRequirements:
          profileReadiness.missingRequirements,
      },
    );
    const missingLabels =
      profileReadiness.missingRequirements
        .map((requirement) =>
          locale === "ar"
            ? requirement.ar
            : requirement.en,
        )
        .join(locale === "ar" ? "، " : ", ");

    return {
      status: "not_talent",
      message:
        locale === "ar"
          ? `أكمل البيانات الأساسية قبل التقديم: ${missingLabels}.`
          : `Complete the required profile information before applying: ${missingLabels}.`,
    };
  }

  const {
    data: opportunity,
    error: opportunityError,
  } = await adminClient
    .from("opportunities")
    .select("id, slug, status, published, created_at, application_days")
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

  if (
    opportunity.created_at &&
    opportunity.application_days
  ) {
    const createdAt = new Date(
      opportunity.created_at,
    );
  
    const applicationDeadline =
      new Date(createdAt);
  
    applicationDeadline.setDate(
      applicationDeadline.getDate() +
        opportunity.application_days,
    );
  
    if (
      !Number.isNaN(
        applicationDeadline.getTime(),
      ) &&
      new Date() > applicationDeadline
    ) {
      return {
        status: "error",
        message:
          locale === "ar"
            ? "انتهت مدة استقبال الطلبات لهذه الفرصة."
            : "The application period for this opportunity has ended.",
      };
    }
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

  const { error: insertError } =
    await adminClient
      .from("opportunity_applications")
      .insert({
        opportunity_id: opportunity.id,
        talent_id: talent.id,
        status: "pending",
      });

  if (insertError) {
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

  if (opportunity.slug) {
    revalidatePath(
      `/${locale}/opportunities/${opportunity.slug}`,
    );
  }

  revalidatePath(
    `/${locale}/talent-dashboard/applications`,
  );
  revalidatePath(
    `/${locale}/talent-dashboard`,
  );

  return {
    status: "success",
    message:
      locale === "ar"
        ? "تم تقديم طلبك بنجاح."
        : "Your application has been submitted successfully.",
  };
}
