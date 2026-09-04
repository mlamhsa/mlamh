"use server";

import { revalidatePath } from "next/cache";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createEvent, EVENT_TARGETS, EVENT_TYPES } from "@/lib/events";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTalentProfileReadiness } from "@/lib/talent/profile-review-readiness";
import { sendTalentProfileRecoveryReminder } from "@/lib/talent/send-profile-recovery-reminder";
import { calculateProfileCompletion } from "@/lib/utils/profile-completion";

const MIN_REVIEW_COMPLETION = 35;

// Keep this select aligned with the real `talents` table schema. The table
// does not have `updated_at`; selecting it makes the whole query fail before
// the reminder workflow can resolve the linked account.
const TALENT_SELECT = "id,user_id,created_at,name_ar,name_en,image_url,primary_role,city_slug,city_ar,city_en,gender,nationality,nationality_slug,date_of_birth,bio_ar,bio_en,languages,dialects,skills,availability_status,portfolio_url,showreel_url,gallery_images,acting_age_min,acting_age_max,modeling_types,height_cm,shoe_size,hair_color,eye_color,chest_size,waist_size,hip_size,previous_work" as const;

type ActionResult = {
  success: boolean;
  message: string;
};

function localeFrom(formData: FormData): "ar" | "en" {
  return formData.get("locale") === "en" ? "en" : "ar";
}

export async function sendTalentRecoveryReminderAction(
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdminAccess();
  const locale = localeFrom(formData);
  const talentId = Number(formData.get("talent_id"));

  if (!Number.isInteger(talentId) || talentId <= 0) {
    return {
      success: false,
      message: locale === "ar" ? "معرّف الموهبة غير صالح." : "Invalid talent id.",
    };
  }

  const adminClient = createAdminClient();
  const { data: talent, error: talentError } = await adminClient
    .from("talents")
    .select(TALENT_SELECT)
    .eq("id", talentId)
    .maybeSingle();

  if (talentError || !talent?.user_id) {
    console.error("[sendTalentRecoveryReminderAction.talent]", talentError);
    return {
      success: false,
      message:
        locale === "ar"
          ? "تعذر تحميل ملف الموهبة أو أنه غير مرتبط بحساب."
          : "Unable to load the talent profile or linked account.",
    };
  }

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id,approval_status")
    .eq("user_id", talent.user_id)
    .maybeSingle();

  if (profileError || !profile) {
    console.error("[sendTalentRecoveryReminderAction.profile]", profileError);
    return {
      success: false,
      message: locale === "ar" ? "تعذر قراءة حالة المراجعة." : "Unable to read review status.",
    };
  }

  const status = String(profile.approval_status ?? "not_submitted");
  if (!["not_submitted", "changes_requested"].includes(status)) {
    return {
      success: false,
      message:
        locale === "ar"
          ? "هذه الحالة لا تحتاج تذكير استكمال يدوي."
          : "This profile state does not require a manual recovery reminder.",
    };
  }

  const readiness = getTalentProfileReadiness(talent);
  const completion = calculateProfileCompletion(talent);
  const kind =
    status === "changes_requested"
      ? "changes_requested"
      : readiness.isReady && completion >= MIN_REVIEW_COMPLETION
        ? "ready_not_submitted"
        : "incomplete_profile";

  let changeReason: string | null = null;
  if (kind === "changes_requested") {
    const { data: latestReview } = await adminClient
      .from("profile_review_history")
      .select("reason")
      .eq("profile_id", profile.id)
      .eq("account_type", "talent")
      .eq("decision", "changes_requested")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    changeReason = latestReview?.reason ?? null;
  }

  const missingItems = readiness.missingRequirements.map((item) =>
    locale === "ar" ? item.ar : item.en,
  );

  const result = await sendTalentProfileRecoveryReminder({
    userId: talent.user_id,
    locale,
    kind,
    missingItems,
    changeReason,
  });

  if (!result.success) {
    return { success: false, message: result.message };
  }

  await createEvent({
    type: EVENT_TYPES.talent_profile_recovery_reminder_sent,
    target: EVENT_TARGETS.TALENT,
    targetId: String(talent.id),
    actorId: admin.id,
    metadata: {
      locale,
      email: result.email,
      provider: result.provider,
      reminder_channel: "email",
      reminder_source: "admin_manual",
      recovery_kind: kind,
      profile_completion: completion,
      missing_requirements: missingItems,
      change_reason: changeReason,
    },
  });

  revalidatePath(`/admin/talents/${talentId}`);

  return {
    success: true,
    message:
      locale === "ar"
        ? `تم إرسال التذكير إلى ${result.email}.`
        : `Reminder sent to ${result.email}.`,
  };
}
