"use server";

import { revalidatePath } from "next/cache";

import {
  isValidLocale,
  type Locale,
} from "@/lib/i18n";
import { TalentProfileService } from "@/lib/services/talent/TalentProfileService";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createEvent,
  EVENT_TARGETS,
  EVENT_TYPES,
} from "@/lib/events";

import {
  getTalentProfileReviewReadiness,
} from "@/lib/talent/profile-review-readiness";
import {
  evaluateTalentFastTrackApproval,
} from "@/lib/talent/fast-track-approval";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type SubmitReviewResult = {
  success: boolean;
  message: string;
  completion?: number;
};

export async function submitTalentProfileReviewAction(
  localeParam: string,
): Promise<SubmitReviewResult> {
  const locale: Locale = isValidLocale(localeParam)
    ? localeParam
    : "ar";

  const isArabic = locale === "ar";

  const authClient =
    await createServerSupabaseClient();

  const adminClient = createAdminClient();

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      message: isArabic
        ? "انتهت جلسة تسجيل الدخول. سجل الدخول مجددًا."
        : "Your session has expired. Please sign in again.",
    };
  }

  const {
    data: profile,
    error: profileError,
  } = await adminClient
    .from("profiles")
    .select(
      "id, account_type, approval_status",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    console.error(
      "[submitTalentProfileReviewAction profile]",
      profileError,
    );

    return {
      success: false,
      message: isArabic
        ? "تعذر العثور على بيانات الحساب."
        : "Unable to find your account profile.",
    };
  }

  if (profile.account_type !== "talent") {
    return {
      success: false,
      message: isArabic
        ? "هذا الإجراء متاح لحسابات المواهب فقط."
        : "This action is only available to talent accounts.",
    };
  }

  if (
    profile.approval_status === "pending" ||
    profile.approval_status === "submitted"
  ) {
    return {
      success: false,
      message: isArabic
        ? "ملفك قيد المراجعة بالفعل."
        : "Your profile is already under review.",
    };
  }

  if (profile.approval_status === "approved") {
    return {
      success: false,
      message: isArabic
        ? "ملفك معتمد بالفعل."
        : "Your profile is already approved.",
    };
  }

  const {
    data: talent,
    error: talentError,
  } = await adminClient
    .from("talents")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (talentError || !talent) {
    console.error(
      "[submitTalentProfileReviewAction talent]",
      talentError,
    );

    return {
      success: false,
      message: isArabic
        ? "أكمل إنشاء ملف الموهبة أولًا."
        : "Complete your talent profile first.",
    };
  }

  const completion =
  TalentProfileService.calculateCompletion(
    talent,
  );

const MIN_REVIEW_COMPLETION = 35;

if (completion < MIN_REVIEW_COMPLETION) {
  return {
    success: false,
    completion,
    message: isArabic
      ? `أكمل ملفك إلى ${MIN_REVIEW_COMPLETION}% على الأقل قبل إرساله للمراجعة. نسبة اكتمال ملفك الحالية ${completion}%.`
      : `Complete at least ${MIN_REVIEW_COMPLETION}% of your profile before submitting it for review. Your current profile completion is ${completion}%.`,
  };
}

const readiness =
  getTalentProfileReviewReadiness(
    talent,
  );

if (!readiness.canSubmitForReview) {
  const missingFields =
    readiness.missingRequirements
      .map((requirement) =>
        isArabic
          ? requirement.ar
          : requirement.en,
      )
      .join("، ");

  return {
    success: false,
    completion,
    message: isArabic
      ? `أكمل البيانات المطلوبة قبل إرسال الملف للمراجعة: ${missingFields}`
      : `Complete the required information before submitting your profile: ${missingFields}`,
  };
}
const fastTrack =
  evaluateTalentFastTrackApproval({
    talent,
    completion,
  });

const shouldAutoApprove =
  fastTrack.decision === "auto_approve";

  const submittedAt =
    new Date().toISOString();

  const {
    error: profileUpdateError,
  } = await adminClient
    .from("profiles")
    .update({
      onboarding_status: "completed",
      onboarding_step: "profile_review",
      approval_status: shouldAutoApprove
  ? "approved"
  : "pending",
      profile_completed_at:
        submittedAt,
    })
    .eq("id", profile.id)
    .eq("user_id", user.id);

  if (profileUpdateError) {
    console.error(
      "[submitTalentProfileReviewAction updateProfile]",
      profileUpdateError,
    );

    return {
      success: false,
      message: isArabic
        ? "تعذر إرسال الملف للمراجعة. حاول مرة أخرى."
        : "Unable to submit the profile for review. Please try again.",
    };
  }

  const {
    error: talentUpdateError,
  } = await adminClient
    .from("talents")
    .update({
      status: shouldAutoApprove
        ? "approved"
        : "pending",
    
      published: shouldAutoApprove,
    
      /*
       * مهم جدًا:
       * verified لا تعني approval.
       * لذلك لا نعطي شارة توثيق تلقائيًا.
       */
      verified: false,
    })
    .eq("user_id", user.id);

    if (talentUpdateError) {
      console.error(
        "[submitTalentProfileReviewAction updateTalent]",
        talentUpdateError,
      );
    
      const { error: rollbackError } =
        await adminClient
          .from("profiles")
          .update({
            approval_status:
              profile.approval_status ??
              "not_submitted",
          })
          .eq("id", profile.id)
          .eq("user_id", user.id);
    
      if (rollbackError) {
        console.error(
          "[submitTalentProfileReviewAction rollbackProfile]",
          rollbackError,
        );
      }
    
      return {
        success: false,
        message: isArabic
          ? "تعذر تحديث حالة ملف الموهبة. تم إلغاء إرسال الملف للمراجعة، حاول مرة أخرى."
          : "Unable to update the talent profile status. The review submission was cancelled. Please try again.",
      };
    }

  try {
    const talentName =
      locale === "ar"
        ? String(
            talent.name_ar ||
            talent.name_en ||
            "",
          ).trim()
        : String(
            talent.name_en ||
            talent.name_ar ||
            "",
          ).trim();
  
    await createEvent({
      type:
        EVENT_TYPES.talent_created,
  
      target:
        EVENT_TARGETS.ADMIN,
  
      targetId:
        "admin",
  
      actorId:
        talent.id,
  
        metadata: {
          locale,
          talent_id:
            talent.id,
          user_id:
            user.id,
          talent_name:
            talentName,
          primary_role:
            talent.primary_role,
          city_slug:
            talent.city_slug,
        
          review_route: shouldAutoApprove
            ? "auto_approved"
            : "manual_review",
        
          fast_track_decision:
            fastTrack.decision,
        
          fast_track_reasons:
            fastTrack.reasons,
        
          profile_completion:
            completion,
        },
    });
  } catch (eventError) {
    console.error(
      "[submitTalentProfileReviewAction event]",
      eventError,
    );
  }

  revalidatePath(
    `/${locale}/talent-dashboard`,
  );

  revalidatePath(
    `/${locale}/talent-dashboard/profile`,
  );

  revalidatePath(
    "/admin",
  );
  
  revalidatePath(
    "/admin/talents",
  );
  
  revalidatePath(
    "/admin/notifications",
  );
  
  return {
    success: true,
    completion,
    message: shouldAutoApprove
  ? isArabic
    ? "تم اعتماد ملفك وأصبح جاهزًا للظهور على ملامح."
    : "Your profile has been approved and is now ready to appear on MLAMH."
  : isArabic
    ? "تم إرسال ملفك للمراجعة بنجاح."
    : "Your profile has been submitted for review.",
  };
}