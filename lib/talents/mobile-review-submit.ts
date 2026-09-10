import { createEvent, EVENT_TARGETS, EVENT_TYPES } from "@/lib/events";
import { evaluateTalentFastTrackApproval } from "@/lib/talent/fast-track-approval";
import { getTalentProfileReviewReadiness } from "@/lib/talent/profile-review-readiness";
import { TalentProfileService } from "@/lib/services/talent/TalentProfileService";
import { createAdminClient } from "@/lib/supabase/admin";

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
  const readiness = getTalentProfileReviewReadiness(talent);
  if (!readiness.canSubmitForReview) {
    const missingFields = readiness.missingRequirements
      .map((requirement) => isArabic ? requirement.ar : requirement.en)
      .join(isArabic ? "، " : ", ");
    return {
      ok: false as const,
      code: "MISSING_REQUIREMENTS" as const,
      completion,
      missingRequirements: readiness.missingRequirements.map((requirement) => ({ key: requirement.key, ar: requirement.ar, en: requirement.en })),
      message: isArabic
        ? `أكمل البيانات المطلوبة قبل إرسال الملف للمراجعة: ${missingFields}`
        : `Complete the required information before submitting your profile: ${missingFields}`,
    };
  }

  const fastTrack = evaluateTalentFastTrackApproval({ talent, completion });
  const shouldAutoApprove = fastTrack.decision === "auto_approve";
  const submittedAt = new Date().toISOString();
  const profileVisibility = String(talent.profile_visibility ?? "public").trim().toLowerCase();
  const isPublicProfile = profileVisibility === "public";
  const shouldPublish = shouldAutoApprove && isPublicProfile;
  const previousApprovalStatus = profile.approval_status ?? "not_submitted";

  const { data: updatedProfile, error: profileUpdateError } = await admin
    .from("profiles")
    .update({
      onboarding_status: "completed",
      onboarding_step: "profile_review",
      approval_status: shouldAutoApprove ? "approved" : "pending",
      profile_completed_at: submittedAt,
      updated_at: submittedAt,
    })
    .eq("id", profile.id)
    .eq("user_id", userId)
    .eq("account_type", "talent")
    .select("approval_status")
    .single();
  if (profileUpdateError || updatedProfile?.approval_status !== (shouldAutoApprove ? "approved" : "pending")) {
    return { ok: false as const, code: "PROFILE_UPDATE_FAILED" as const, completion, message: isArabic ? "تعذر إرسال الملف للمراجعة. حاول مرة أخرى." : "Unable to submit the profile for review. Please try again." };
  }

  const { data: updatedTalent, error: talentUpdateError } = await admin
    .from("talents")
    .update({
      status: shouldAutoApprove ? "approved" : "pending",
      published: shouldPublish,
      verified: false,
    })
    .eq("user_id", userId)
    .select("id,status,published")
    .single();

  if (
    talentUpdateError ||
    updatedTalent?.status !== (shouldAutoApprove ? "approved" : "pending") ||
    Boolean(updatedTalent?.published) !== shouldPublish
  ) {
    await admin
      .from("profiles")
      .update({ approval_status: previousApprovalStatus })
      .eq("id", profile.id)
      .eq("user_id", userId)
      .eq("account_type", "talent");
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
        approval_status: shouldAutoApprove ? "approved" : "pending",
        profile_visibility: isPublicProfile ? "public" : "private",
        public_published: shouldPublish,
      },
    });

    // Auto-approved profiles must go through the same updated review outcome
    // event as manual approvals so notifications/email reflect the persisted state.
    if (shouldAutoApprove) {
      await createEvent({
        type: EVENT_TYPES.talent_approved,
        target: EVENT_TARGETS.TALENT,
        targetId: talent.id,
        metadata: {
          locale,
          talent_id: talent.id,
          profile_id: profile.id,
          previous_status: previousApprovalStatus,
          approval_status: "approved",
          review_route: "auto_approved",
          profile_visibility: isPublicProfile ? "public" : "private",
          public_published: shouldPublish,
        },
      });
    }
  } catch (eventError) {
    console.error("[submitMobileTalentProfileReview event]", eventError);
  }

  return {
    ok: true as const,
    completion,
    approvalStatus: shouldAutoApprove ? "approved" as const : "pending" as const,
    message: shouldAutoApprove
      ? (isArabic ? "تم اعتماد ملفك وأصبح جاهزًا للاستخدام على ملامح." : "Your profile has been approved and is now ready to use on MLAMH.")
      : (isArabic ? "تم إرسال ملفك للمراجعة بنجاح." : "Your profile has been submitted for review."),
  };
}
