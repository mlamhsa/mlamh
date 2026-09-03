import { createEvent, EVENT_TARGETS, EVENT_TYPES } from "@/lib/events";
import { evaluateTalentFastTrackApproval } from "@/lib/talent/fast-track-approval";
import { getTalentProfileReviewReadiness } from "@/lib/talent/profile-review-readiness";
import { TalentProfileService } from "@/lib/services/talent/TalentProfileService";
import { createAdminClient } from "@/lib/supabase/admin";

const MIN_REVIEW_COMPLETION = 35;

export async function submitMobileTalentProfileReview(userId: string, locale: "ar" | "en") {
  const isArabic = locale === "ar";
  const admin = createAdminClient();

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id,account_type,approval_status")
    .eq("user_id", userId)
    .maybeSingle();
  if (profileError || !profile) {
    return { ok: false as const, code: "PROFILE_NOT_FOUND" as const, message: isArabic ? "تعذر العثور على بيانات الحساب." : "Unable to find your account profile." };
  }
  if (profile.account_type !== "talent") {
    return { ok: false as const, code: "NOT_TALENT" as const, message: isArabic ? "هذا الإجراء متاح لحسابات المواهب فقط." : "This action is only available to talent accounts." };
  }
  if (profile.approval_status === "pending" || profile.approval_status === "submitted") {
    return { ok: false as const, code: "ALREADY_PENDING" as const, message: isArabic ? "ملفك قيد المراجعة بالفعل." : "Your profile is already under review." };
  }
  if (profile.approval_status === "approved") {
    return { ok: false as const, code: "ALREADY_APPROVED" as const, message: isArabic ? "ملفك معتمد بالفعل." : "Your profile is already approved." };
  }

  const { data: talent, error: talentError } = await admin
    .from("talents")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (talentError || !talent) {
    return { ok: false as const, code: "TALENT_NOT_FOUND" as const, message: isArabic ? "أكمل إنشاء ملف الموهبة أولًا." : "Complete your talent profile first." };
  }

  const completion = TalentProfileService.calculateCompletion(talent);
  if (completion < MIN_REVIEW_COMPLETION) {
    return {
      ok: false as const,
      code: "PROFILE_INCOMPLETE" as const,
      completion,
      message: isArabic
        ? `أكمل ملفك إلى ${MIN_REVIEW_COMPLETION}% على الأقل قبل إرساله للمراجعة. نسبة اكتمال ملفك الحالية ${completion}%.`
        : `Complete at least ${MIN_REVIEW_COMPLETION}% of your profile before submitting it for review. Your current profile completion is ${completion}%.`,
    };
  }

  const readiness = getTalentProfileReviewReadiness(talent);
  if (!readiness.canSubmitForReview) {
    const missingFields = readiness.missingRequirements
      .map((requirement) => isArabic ? requirement.ar : requirement.en)
      .join(isArabic ? "، " : ", ");
    return {
      ok: false as const,
      code: "MISSING_REQUIREMENTS" as const,
      completion,
      message: isArabic
        ? `أكمل البيانات المطلوبة قبل إرسال الملف للمراجعة: ${missingFields}`
        : `Complete the required information before submitting your profile: ${missingFields}`,
    };
  }

  const fastTrack = evaluateTalentFastTrackApproval({ talent, completion });
  const shouldAutoApprove = fastTrack.decision === "auto_approve";
  const submittedAt = new Date().toISOString();

  const { error: profileUpdateError } = await admin
    .from("profiles")
    .update({
      onboarding_status: "completed",
      onboarding_step: "profile_review",
      approval_status: shouldAutoApprove ? "approved" : "pending",
      profile_completed_at: submittedAt,
      updated_at: submittedAt,
    })
    .eq("id", profile.id)
    .eq("user_id", userId);
  if (profileUpdateError) {
    return { ok: false as const, code: "PROFILE_UPDATE_FAILED" as const, completion, message: isArabic ? "تعذر إرسال الملف للمراجعة. حاول مرة أخرى." : "Unable to submit the profile for review. Please try again." };
  }

  const { error: talentUpdateError } = await admin
    .from("talents")
    .update({
      status: shouldAutoApprove ? "approved" : "pending",
      published: shouldAutoApprove,
      verified: false,
    })
    .eq("user_id", userId);

  if (talentUpdateError) {
    await admin
      .from("profiles")
      .update({ approval_status: profile.approval_status ?? "not_submitted" })
      .eq("id", profile.id)
      .eq("user_id", userId);
    return { ok: false as const, code: "TALENT_UPDATE_FAILED" as const, completion, message: isArabic ? "تعذر تحديث حالة ملف الموهبة. تم إلغاء إرسال الملف للمراجعة، حاول مرة أخرى." : "Unable to update the talent profile status. The review submission was cancelled. Please try again." };
  }

  try {
    const talentName = locale === "ar"
      ? String(talent.name_ar || talent.name_en || "").trim()
      : String(talent.name_en || talent.name_ar || "").trim();
    await createEvent({
      type: EVENT_TYPES.talent_created,
      target: EVENT_TARGETS.ADMIN,
      targetId: "admin",
      actorId: talent.id,
      metadata: {
        locale,
        talent_id: talent.id,
        user_id: userId,
        talent_name: talentName,
        primary_role: talent.primary_role,
        city_slug: talent.city_slug,
        review_route: shouldAutoApprove ? "auto_approved" : "manual_review",
        fast_track_decision: fastTrack.decision,
        fast_track_reasons: fastTrack.reasons,
        profile_completion: completion,
      },
    });
  } catch (eventError) {
    console.error("[submitMobileTalentProfileReview event]", eventError);
  }

  return {
    ok: true as const,
    completion,
    approvalStatus: shouldAutoApprove ? "approved" as const : "pending" as const,
    message: shouldAutoApprove
      ? (isArabic ? "تم اعتماد ملفك وأصبح جاهزًا للظهور على ملامح." : "Your profile has been approved and is now ready to appear on MLAMH.")
      : (isArabic ? "تم إرسال ملفك للمراجعة بنجاح." : "Your profile has been submitted for review."),
  };
}
