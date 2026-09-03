"use server";

import { revalidatePath } from "next/cache";

import type { ApplyOpportunityResult } from "@/lib/applications/apply-contract";
import { isValidOpportunityId } from "@/lib/applications/apply-rules";
import { applyToOpportunity } from "@/lib/applications/apply-service";
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

type Locale = "ar" | "en";

type ReadinessRequirement = {
  ar?: string;
  en?: string;
};

function getIncompleteProfileMessage(
  result: Extract<ApplyOpportunityResult, { ok: false }>,
  locale: Locale,
) {
  const requirements = result.details?.missingRequirements;
  if (!Array.isArray(requirements)) {
    return locale === "ar"
      ? "أكمل البيانات الأساسية قبل التقديم."
      : "Complete the required profile information before applying.";
  }

  const labels = requirements
    .map((requirement) => {
      if (!requirement || typeof requirement !== "object") return null;
      const value = requirement as ReadinessRequirement;
      return locale === "ar" ? value.ar : value.en;
    })
    .filter((label): label is string => Boolean(label))
    .join(locale === "ar" ? "، " : ", ");

  if (!labels) {
    return locale === "ar"
      ? "أكمل البيانات الأساسية قبل التقديم."
      : "Complete the required profile information before applying.";
  }

  return locale === "ar"
    ? `أكمل البيانات الأساسية قبل التقديم: ${labels}.`
    : `Complete the required profile information before applying: ${labels}.`;
}

function toWebApplyResult(
  result: ApplyOpportunityResult,
  locale: Locale,
): ApplyResult {
  if (result.ok) {
    return {
      status: "success",
      message:
        locale === "ar"
          ? "تم تقديم طلبك بنجاح."
          : "Your application has been submitted successfully.",
    };
  }

  switch (result.code) {
    case "ALREADY_APPLIED":
      return {
        status: "already_applied",
        message:
          locale === "ar"
            ? "لقد قدمت على هذه الفرصة مسبقًا."
            : "You have already applied to this opportunity.",
      };
    case "NOT_TALENT":
      return {
        status: "not_talent",
        message:
          locale === "ar"
            ? "يجب إنشاء ملف موهبة قبل التقديم."
            : "Please create your talent profile before applying.",
      };
    case "PROFILE_INCOMPLETE":
      return {
        status: "not_talent",
        message: getIncompleteProfileMessage(result, locale),
      };
    case "ACCOUNT_RESTRICTED":
      return {
        status: "unauthorized",
        message:
          locale === "ar"
            ? "هذا الحساب غير متاح للتقديم حاليًا."
            : "This account is not currently allowed to apply.",
      };
    case "TALENT_NOT_APPROVED":
      return {
        status: "unauthorized",
        message:
          locale === "ar"
            ? "يجب اعتماد ملف الموهبة من الإدارة قبل التقديم على الفرص."
            : "Your talent profile must be approved before applying to opportunities.",
      };
    case "OPPORTUNITY_NOT_AVAILABLE":
      return {
        status: "error",
        message:
          locale === "ar"
            ? "هذه الفرصة غير متاحة للتقديم حاليًا."
            : "This opportunity is not currently open for applications.",
      };
    case "APPLICATION_WINDOW_CLOSED":
      return {
        status: "error",
        message:
          locale === "ar"
            ? "انتهت مدة استقبال الطلبات لهذه الفرصة."
            : "The application period for this opportunity has ended.",
      };
    case "PROFILE_LOOKUP_FAILED":
      return {
        status: "error",
        message:
          locale === "ar"
            ? "تعذر التحقق من الحساب. حاول مرة أخرى."
            : "Unable to verify your account. Please try again.",
      };
    case "TALENT_LOOKUP_FAILED":
      return {
        status: "error",
        message:
          locale === "ar"
            ? "تعذر التحقق من ملف الموهبة."
            : "Unable to verify your talent profile.",
      };
    case "OPPORTUNITY_LOOKUP_FAILED":
      return {
        status: "error",
        message:
          locale === "ar"
            ? "تعذر تحميل بيانات الفرصة."
            : "Unable to load the opportunity.",
      };
    case "APPLICATION_LOOKUP_FAILED":
      return {
        status: "error",
        message:
          locale === "ar"
            ? "تعذر التحقق من حالة الطلب."
            : "Unable to verify your application status.",
      };
    case "INVALID_OPPORTUNITY":
      return {
        status: "error",
        message:
          locale === "ar"
            ? "بيانات الفرصة غير صحيحة."
            : "Invalid opportunity.",
      };
    default:
      return {
        status: "error",
        message:
          locale === "ar"
            ? "حدث خطأ أثناء التقديم. حاول مرة أخرى."
            : "Something went wrong while applying. Please try again.",
      };
  }
}

export async function applyToOpportunityAction(
  _prevState: ApplyResult | null,
  formData: FormData,
): Promise<ApplyResult> {
  const opportunityId = Number(formData.get("opportunity_id"));
  const locale: Locale = formData.get("locale") === "en" ? "en" : "ar";

  if (!isValidOpportunityId(opportunityId)) {
    return toWebApplyResult(
      { ok: false, code: "INVALID_OPPORTUNITY" },
      locale,
    );
  }

  const authClient = await createServerSupabaseClient();
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

  const result = await applyToOpportunity({
    userId: user.id,
    opportunityId,
  });

  if (result.ok) {
    if (result.opportunitySlug) {
      revalidatePath(`/${locale}/opportunities/${result.opportunitySlug}`);
    }

    revalidatePath(`/${locale}/talent-dashboard/applications`);
    revalidatePath(`/${locale}/talent-dashboard`);
    revalidatePath(`/admin/opportunities/${result.opportunityId}`);
    revalidatePath("/admin/opportunity-applications");
  }

  return toWebApplyResult(result, locale);
}
