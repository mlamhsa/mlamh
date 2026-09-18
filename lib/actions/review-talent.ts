"use server";

import { revalidatePath } from "next/cache";
import { createEvent } from "@/lib/events/create-event";
import { recordAdminAction } from "@/lib/events/admin-audit";
import { EVENT_TARGETS } from "@/lib/events/event-targets";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { TALENT_CATEGORIES } from "@/lib/data/talent-categories";
import { isActiveTalentCountryCode } from "@/lib/data/talent-active-market";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTalentProfileReviewReadiness } from "@/lib/talent/profile-review-readiness";

type ReviewDecision = "approved" | "changes_requested" | "rejected";

type ReviewActionResult = {
  success: boolean;
  message: string;
  status?: ReviewDecision;
};

function parseTalentId(formData: FormData): number {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid talent id.");
  return id;
}

function getLocale(formData: FormData): "ar" | "en" {
  return formData.get("locale") === "en" ? "en" : "ar";
}

function getOptionalText(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized || null;
}

function revalidateTalentReviewPaths(id: number) {
  revalidatePath("/admin");
  revalidatePath("/admin/talents");
  revalidatePath(`/admin/talents/${id}`);
  revalidatePath(`/admin/talents/${id}/edit`);
  revalidatePath("/ar/talent");
  revalidatePath("/en/talent");
  revalidatePath("/ar/talent-dashboard");
  revalidatePath("/en/talent-dashboard");
  revalidatePath("/ar/talent-dashboard/profile");
  revalidatePath("/en/talent-dashboard/profile");
}

async function updateTalentReviewStatus({
  id,
  decision,
  locale,
  reason,
  adminNote,
}: {
  id: number;
  decision: ReviewDecision;
  locale: "ar" | "en";
  reason?: string | null;
  adminNote?: string | null;
}): Promise<ReviewActionResult> {
  const adminUser = await requireAdminAccess();
  const adminClient = createAdminClient();

  const { data: talent, error: talentError } = await adminClient
    .from("talents")
    .select("id,user_id,status,published,image_url,profile_visibility,name_ar,name_en,primary_role,category_slug,base_country_code,city_slug,gender,nationality_slug,nationality,date_of_birth")
    .eq("id", id)
    .maybeSingle();

  if (talentError) {
    console.error("[updateTalentReviewStatus talent]", talentError);

    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "review_talent_profile",
      outcome: "failed",
      target: EVENT_TARGETS.TALENT,
      targetId: id,
      reason: "talent_load_failed",
      metadata: {
        requested_decision:
          decision,
      },
    });

    return {
      success: false,
      message: locale === "ar" ? "تعذر تحميل ملف الموهبة." : "Unable to load the talent profile.",
    };
  }

  if (!talent) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "review_talent_profile",
      outcome: "failed",
      target: EVENT_TARGETS.TALENT,
      targetId: id,
      reason: "talent_not_found",
      metadata: {
        requested_decision:
          decision,
      },
    });

    return {
      success: false,
      message: locale === "ar" ? "لم يتم العثور على ملف الموهبة." : "Talent profile not found.",
    };
  }

  if (!talent.user_id) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "review_talent_profile",
      outcome: "failed",
      target: EVENT_TARGETS.TALENT,
      targetId: id,
      reason: "talent_user_account_missing",
      metadata: {
        requested_decision:
          decision,
      },
    });

    return {
      success: false,
      message: locale === "ar"
        ? "ملف الموهبة غير مرتبط بحساب مستخدم."
        : "The talent profile is not linked to a user account.",
    };
  }

  if (decision === "changes_requested" && !reason) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "review_talent_profile",
      outcome: "blocked",
      target: EVENT_TARGETS.TALENT,
      targetId: id,
      reason: "changes_reason_required",
      metadata: {
        requested_decision:
          decision,
      },
    });

    return {
      success: false,
      message: locale === "ar" ? "اكتب سبب طلب التعديل." : "Please provide a reason for requesting changes.",
    };
  }

  if (decision === "rejected" && !reason) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "review_talent_profile",
      outcome: "blocked",
      target: EVENT_TARGETS.TALENT,
      targetId: id,
      reason: "rejection_reason_required",
      metadata: {
        requested_decision:
          decision,
      },
    });

    return {
      success: false,
      message: locale === "ar" ? "اكتب سبب رفض الملف." : "Please provide a reason for rejecting the profile.",
    };
  }

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id,account_type,approval_status,phone,data_accuracy_contact_consent")
    .eq("user_id", talent.user_id)
    .maybeSingle();

  if (profileError) {
    console.error("[updateTalentReviewStatus profile read]", profileError);

    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "review_talent_profile",
      outcome: "failed",
      target: EVENT_TARGETS.TALENT,
      targetId: id,
      reason: "talent_profile_lookup_failed",
      metadata: {
        requested_decision:
          decision,
      },
    });

    return {
      success: false,
      message: locale === "ar"
        ? "تعذر قراءة حالة المراجعة الحالية."
        : "Unable to read the current review status.",
    };
  }

  if (!profile || profile.account_type !== "talent") {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "review_talent_profile",
      outcome: "failed",
      target: EVENT_TARGETS.TALENT,
      targetId: id,
      reason: "linked_talent_profile_not_found",
      metadata: {
        requested_decision:
          decision,
      },
    });

    return {
      success: false,
      message: locale === "ar"
        ? "لم يتم العثور على حساب موهبة مرتبط بهذا الملف."
        : "A linked talent account could not be found for this profile.",
    };
  }

  if (decision === "approved") {
    const activeRole = String(talent.primary_role ?? talent.category_slug ?? "").trim().toLowerCase();
    const roleIsActive = TALENT_CATEGORIES.some((category) => category.slug === activeRole);
    if (!roleIsActive || !isActiveTalentCountryCode(talent.base_country_code)) {
      await recordAdminAction({
        actorId: adminUser.id,
        actorEmail: adminUser.email,
        action: "review_talent_profile",
        outcome: "blocked",
        target: EVENT_TARGETS.TALENT,
        targetId: id,
        reason: "talent_outside_active_launch_scope",
        metadata: {
          requested_decision:
            decision,
          primary_role:
            activeRole,
          base_country_code:
            talent.base_country_code,
        },
      });

      return {
        success: false,
        message: locale === "ar"
          ? "لا يمكن اعتماد الملف: الإطلاق الحالي متاح للممثلين والمودلز المقيمين في السعودية فقط."
          : "The profile cannot be approved: the current launch is limited to actors and models based in Saudi Arabia.",
      };
    }

    const readiness = getTalentProfileReviewReadiness({
      ...talent,
      phone: profile.phone,
      data_accuracy_contact_consent: profile.data_accuracy_contact_consent === true,
    });

    if (!readiness.canSubmitForReview) {
      const missingFields = readiness.missingRequirements
        .map((requirement) => (locale === "ar" ? requirement.ar : requirement.en))
        .join("، ");

      await recordAdminAction({
        actorId: adminUser.id,
        actorEmail: adminUser.email,
        action: "review_talent_profile",
        outcome: "blocked",
        target: EVENT_TARGETS.TALENT,
        targetId: id,
        reason: "core_requirements_incomplete",
        metadata: {
          requested_decision:
            decision,
          missing_requirements:
            readiness.missingRequirements.map(
              (requirement) =>
                requirement.key,
            ),
        },
      });

      return {
        success: false,
        message:
          locale === "ar"
            ? `لا يمكن اعتماد الملف قبل اكتمال المتطلبات الأساسية: ${missingFields}`
            : `The profile cannot be approved until all core requirements are complete: ${missingFields}`,
      };
    }
  }

  const previousStatus = profile.approval_status ?? "not_submitted";
  const talentStatus = decision === "changes_requested" ? "pending" : decision;
  const visibility = String(talent.profile_visibility ?? "public").trim().toLowerCase();
  const isPublicProfile = visibility === "public";
  const published = decision === "approved" && isPublicProfile;

  if (previousStatus === decision) {
    const { error: syncError } = await adminClient
      .from("talents")
      .update({ status: talentStatus, published })
      .eq("id", id);

    if (syncError) {
      console.error("[updateTalentReviewStatus idempotent sync]", syncError);

      await recordAdminAction({
        actorId: adminUser.id,
        actorEmail: adminUser.email,
        action: "review_talent_profile",
        outcome: "failed",
        target: EVENT_TARGETS.TALENT,
        targetId: id,
        reason: "idempotent_operational_sync_failed",
        metadata: {
          current_status:
            previousStatus,
          requested_decision:
            decision,
        },
      });

      return {
        success: false,
        message: locale === "ar"
          ? "الحالة معتمدة في النظام، لكن تعذر مزامنة بيانات التشغيل."
          : "The review state is already saved, but operational fields could not be synchronized.",
      };
    }

    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "review_talent_profile",
      outcome: "noop",
      target: EVENT_TARGETS.TALENT,
      targetId: id,
      reason: "decision_already_set",
      metadata: {
        current_status:
          previousStatus,
        requested_decision:
          decision,
        operational_sync_completed:
          true,
      },
    });

    revalidateTalentReviewPaths(id);
    return {
      success: true,
      status: decision,
      message: locale === "ar" ? "الحالة محفوظة بالفعل وتمت مزامنة الملف." : "The status was already saved and the profile has been synchronized.",
    };
  }

  const { data: updatedProfile, error: profileUpdateError } = await adminClient
    .from("profiles")
    .update({ approval_status: decision })
    .eq("id", profile.id)
    .eq("account_type", "talent")
    .select("id, approval_status")
    .single();

  if (profileUpdateError || updatedProfile?.approval_status !== decision) {
    console.error("[updateTalentReviewStatus profile update]", profileUpdateError ?? { updatedProfile });

    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "review_talent_profile",
      outcome: "failed",
      target: EVENT_TARGETS.TALENT,
      targetId: id,
      reason: "profile_review_status_update_failed",
      metadata: {
        previous_status:
          previousStatus,
        requested_decision:
          decision,
      },
    });

    return {
      success: false,
      message: locale === "ar"
        ? "تعذر تحديث حالة مراجعة الحساب."
        : "Unable to update the account review status.",
    };
  }

  const { data: updatedTalent, error: talentUpdateError } = await adminClient
    .from("talents")
    .update({ status: talentStatus, published })
    .eq("id", id)
    .select("id, status, published")
    .single();

  if (
    talentUpdateError ||
    updatedTalent?.status !== talentStatus ||
    Boolean(updatedTalent?.published) !== published
  ) {
    console.error("[updateTalentReviewStatus talent update]", talentUpdateError ?? { updatedTalent });
    await adminClient
      .from("profiles")
      .update({ approval_status: previousStatus })
      .eq("id", profile.id)
      .eq("account_type", "talent");

    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "review_talent_profile",
      outcome: "failed",
      target: EVENT_TARGETS.TALENT,
      targetId: id,
      reason: "talent_operational_update_failed",
      metadata: {
        previous_status:
          previousStatus,
        requested_decision:
          decision,
        profile_rollback_attempted:
          true,
      },
    });

    return {
      success: false,
      message: locale === "ar"
        ? "تعذر إكمال قرار المراجعة. تم إلغاء التغيير."
        : "Unable to complete the review decision. The change was rolled back.",
    };
  }

  const { error: historyError } = await adminClient
    .from("profile_review_history")
    .insert({
      profile_id: profile.id,
      account_type: "talent",
      talent_id: id,
      reviewer_user_id: adminUser.id,
      decision,
      reason: reason ?? null,
      admin_note: adminNote ?? null,
      previous_status: previousStatus,
      new_status: decision,
    });

  if (historyError) {
    console.error("[updateTalentReviewStatus history]", historyError);
    await Promise.all([
      adminClient
        .from("profiles")
        .update({ approval_status: previousStatus })
        .eq("id", profile.id)
        .eq("account_type", "talent"),
      adminClient
        .from("talents")
        .update({ status: talent.status, published: talent.published })
        .eq("id", id),
    ]);

    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "review_talent_profile",
      outcome: "failed",
      target: EVENT_TARGETS.TALENT,
      targetId: id,
      reason: "review_history_write_failed",
      metadata: {
        previous_status:
          previousStatus,
        requested_decision:
          decision,
        rollback_attempted: true,
      },
    });

    return {
      success: false,
      message: locale === "ar"
        ? "تعذر حفظ سجل المراجعة، لذلك تم إلغاء القرار."
        : "The review history could not be saved, so the decision was rolled back.",
    };
  }

  const { data: persistedProfile, error: verifyError } = await adminClient
    .from("profiles")
    .select("approval_status")
    .eq("id", profile.id)
    .eq("account_type", "talent")
    .maybeSingle();

  if (verifyError || persistedProfile?.approval_status !== decision) {
    console.error("[updateTalentReviewStatus verify]", verifyError ?? { persistedProfile, decision });

    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "review_talent_profile",
      outcome: "failed",
      target: EVENT_TARGETS.TALENT,
      targetId: id,
      reason: "final_state_verification_failed",
      metadata: {
        previous_status:
          previousStatus,
        requested_decision:
          decision,
        persisted_status:
          persistedProfile?.approval_status ??
          null,
      },
    });

    return {
      success: false,
      message: locale === "ar"
        ? "تم حفظ القرار جزئيًا، لكن تعذر التحقق من الحالة النهائية. لم يتم إرسال إشعار الاعتماد."
        : "The decision was partially saved, but the final state could not be verified. No approval notification was sent.",
    };
  }

  const eventType = decision === "approved"
    ? "talent_approved"
    : decision === "changes_requested"
      ? "talent_changes_requested"
      : "talent_rejected";

  await createEvent({
    type: eventType,
    target: "talent",
    targetId: talent.id,
    actorId: adminUser.id,
    metadata: {
      locale,
      talent_id: id,
      profile_id: profile.id,
      previous_status: previousStatus,
      approval_status: decision,
      profile_visibility: isPublicProfile ? "public" : "private",
      public_published: published,
      reason: reason ?? null,
      admin_note: adminNote ?? null,
    },
  });

  await recordAdminAction({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    action: "review_talent_profile",
    outcome: "success",
    target: EVENT_TARGETS.TALENT,
    targetId: id,
    metadata: {
      profile_id:
        profile.id,
      previous_status:
        previousStatus,
      new_status:
        decision,
      profile_visibility:
        isPublicProfile
          ? "public"
          : "private",
      public_published:
        published,
      reason:
        reason ?? null,
      admin_note:
        adminNote ?? null,
    },
  });

  revalidateTalentReviewPaths(id);

  let successMessage: string;
  if (decision === "approved" && isPublicProfile) {
    successMessage = locale === "ar"
      ? "تم اعتماد ملف الموهبة ونشره في الدليل العام بنجاح."
      : "The talent profile has been approved and published in the public directory.";
  } else if (decision === "approved") {
    successMessage = locale === "ar"
      ? "تم اعتماد ملف الموهبة. الملف خاص وسيبقى غير ظاهر في الدليل العام."
      : "The talent profile has been approved. It is private and will remain hidden from the public directory.";
  } else if (decision === "changes_requested") {
    successMessage = locale === "ar" ? "تم إرسال الملف للتعديل." : "The profile has been returned for changes.";
  } else {
    successMessage = locale === "ar" ? "تم رفض ملف الموهبة." : "The talent profile has been rejected.";
  }

  return { success: true, status: decision, message: successMessage };
}

export async function approveTalentAction(formData: FormData): Promise<ReviewActionResult> {
  return updateTalentReviewStatus({
    id: parseTalentId(formData),
    decision: "approved",
    locale: getLocale(formData),
    reason: getOptionalText(formData, "reason"),
    adminNote: getOptionalText(formData, "admin_note"),
  });
}

export async function requestTalentChangesAction(formData: FormData): Promise<ReviewActionResult> {
  return updateTalentReviewStatus({
    id: parseTalentId(formData),
    decision: "changes_requested",
    locale: getLocale(formData),
    reason: getOptionalText(formData, "reason"),
    adminNote: getOptionalText(formData, "admin_note"),
  });
}

export async function rejectTalentAction(formData: FormData): Promise<ReviewActionResult> {
  return updateTalentReviewStatus({
    id: parseTalentId(formData),
    decision: "rejected",
    locale: getLocale(formData),
    reason: getOptionalText(formData, "reason"),
    adminNote: getOptionalText(formData, "admin_note"),
  });
}
