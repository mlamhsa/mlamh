"use server";

import { revalidatePath } from "next/cache";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { recordAdminAction } from "@/lib/events/admin-audit";
import { EVENT_TARGETS } from "@/lib/events/event-targets";
import { createAdminClient } from "@/lib/supabase/admin";

type ReviewTalentProfileChangeResult = {
  success: boolean;
  message: string;
};

type TalentProfileChangeRequest = {
  id: number | string;
  user_id: string;
  talent_id: number | string;
  status: string;
};

function revalidateTalentProfileChangePaths(talentId: number | string) {
  revalidatePath("/admin/talents");
  revalidatePath(`/admin/talents/${talentId}`);
  revalidatePath("/ar/talent-dashboard");
  revalidatePath("/ar/talent-dashboard/profile");
  revalidatePath("/en/talent-dashboard");
  revalidatePath("/en/talent-dashboard/profile");
  revalidatePath("/ar/talent");
  revalidatePath("/en/talent");
}

export async function approveTalentProfileChangeAction(
  requestId: number | string,
): Promise<ReviewTalentProfileChangeResult> {
  const adminUser = await requireAdminAccess();
  const adminClient = createAdminClient();
  const normalizedRequestId = Number(requestId);

  if (!Number.isInteger(normalizedRequestId) || normalizedRequestId <= 0) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "approve_talent_profile_change",
      outcome: "blocked",
      target: EVENT_TARGETS.TALENT,
      targetId: "invalid-input",
      reason: "invalid_change_request_id",
    });

    return {
      success: false,
      message: "طلب التعديل غير صالح.",
    };
  }

  const { data: request, error: requestError } = await adminClient
    .from("talent_profile_change_requests")
    .select("id, user_id, talent_id, status")
    .eq("id", normalizedRequestId)
    .maybeSingle();

  if (requestError) {
    console.error("[approveTalentProfileChangeAction request]", requestError);

    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "approve_talent_profile_change",
      outcome: "failed",
      target: EVENT_TARGETS.TALENT,
      targetId: normalizedRequestId,
      reason: "change_request_load_failed",
    });

    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "reject_talent_profile_change",
      outcome: "failed",
      target: EVENT_TARGETS.TALENT,
      targetId: normalizedRequestId,
      reason: "change_request_load_failed",
    });

    return {
      success: false,
      message: "تعذر تحميل طلب التعديل.",
    };
  }

  if (!request) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "approve_talent_profile_change",
      outcome: "failed",
      target: EVENT_TARGETS.TALENT,
      targetId: normalizedRequestId,
      reason: "change_request_not_found",
    });

    return {
      success: false,
      message: "طلب التعديل غير موجود.",
    };
  }

  const changeRequest = request as TalentProfileChangeRequest;

  if (changeRequest.status !== "pending") {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "approve_talent_profile_change",
      outcome: "noop",
      target: EVENT_TARGETS.TALENT,
      targetId: changeRequest.talent_id,
      reason: "change_request_already_processed",
      metadata: {
        request_id:
          normalizedRequestId,
        current_status:
          changeRequest.status,
      },
    });

    return {
      success: false,
      message: "تمت معالجة هذا الطلب مسبقًا.",
    };
  }

  const { data: approved, error: approvalError } = await adminClient.rpc(
    "approve_talent_profile_change_request",
    {
      p_request_id: normalizedRequestId,
      p_reviewer_user_id: adminUser.id,
    },
  );

  if (approvalError) {
    console.error("[approveTalentProfileChangeAction rpc]", approvalError);

    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "approve_talent_profile_change",
      outcome: "failed",
      target: EVENT_TARGETS.TALENT,
      targetId: changeRequest.talent_id,
      reason: "change_request_approval_failed",
      metadata: {
        request_id:
          normalizedRequestId,
      },
    });

    return {
      success: false,
      message: "تعذر اعتماد التغييرات. لم يتم تطبيق أي تعديل.",
    };
  }

  if (approved !== true) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "approve_talent_profile_change",
      outcome: "noop",
      target: EVENT_TARGETS.TALENT,
      targetId: changeRequest.talent_id,
      reason: "change_request_not_applied",
      metadata: {
        request_id:
          normalizedRequestId,
      },
    });

    return {
      success: false,
      message: "تمت معالجة هذا الطلب مسبقًا أو تعذر التحقق منه.",
    };
  }

  await recordAdminAction({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    action: "approve_talent_profile_change",
    outcome: "success",
    target: EVENT_TARGETS.TALENT,
    targetId: changeRequest.talent_id,
    metadata: {
      request_id:
        normalizedRequestId,
      user_id:
        changeRequest.user_id,
      previous_status:
        changeRequest.status,
      new_status: "approved",
    },
  });

  revalidateTalentProfileChangePaths(changeRequest.talent_id);

  return {
    success: true,
    message: "تم اعتماد التغييرات وتحديث البيانات.",
  };
}

export async function rejectTalentProfileChangeAction(
  requestId: number | string,
): Promise<ReviewTalentProfileChangeResult> {
  const adminUser = await requireAdminAccess();
  const adminClient = createAdminClient();
  const normalizedRequestId =
    Number(requestId);

  if (
    !Number.isInteger(
      normalizedRequestId,
    ) ||
    normalizedRequestId <= 0
  ) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "reject_talent_profile_change",
      outcome: "blocked",
      target: EVENT_TARGETS.TALENT,
      targetId: "invalid-input",
      reason: "invalid_change_request_id",
    });

    return {
      success: false,
      message: "طلب التعديل غير صالح.",
    };
  }

  const { data: request, error: requestError } = await adminClient
    .from("talent_profile_change_requests")
    .select(`
      id,
      user_id,
      talent_id,
      status
    `)
    .eq("id", normalizedRequestId)
    .maybeSingle();

  if (requestError) {
    console.error(
      "[rejectTalentProfileChangeAction request]",
      requestError,
    );

    return {
      success: false,
      message: "تعذر تحميل طلب التعديل.",
    };
  }

  if (!request) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "reject_talent_profile_change",
      outcome: "failed",
      target: EVENT_TARGETS.TALENT,
      targetId: normalizedRequestId,
      reason: "change_request_not_found",
    });

    return {
      success: false,
      message: "طلب التعديل غير موجود.",
    };
  }

  if (request.status !== "pending") {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "reject_talent_profile_change",
      outcome: "noop",
      target: EVENT_TARGETS.TALENT,
      targetId: request.talent_id,
      reason: "change_request_already_processed",
      metadata: {
        request_id:
          request.id,
        current_status:
          request.status,
      },
    });

    return {
      success: false,
      message: "تمت معالجة هذا الطلب مسبقًا.",
    };
  }

  const reviewedAt = new Date().toISOString();

  const { error: reviewUpdateError } = await adminClient
    .from("talent_profile_change_requests")
    .update({
      status: "rejected",
      reviewed_at: reviewedAt,
      reviewed_by: adminUser.id,
    })
    .eq("id", request.id)
    .eq("status", "pending");

  if (reviewUpdateError) {
    console.error(
      "[rejectTalentProfileChangeAction review]",
      reviewUpdateError,
    );

    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "reject_talent_profile_change",
      outcome: "failed",
      target: EVENT_TARGETS.TALENT,
      targetId: request.talent_id,
      reason: "change_request_rejection_failed",
      metadata: {
        request_id:
          request.id,
      },
    });

    return {
      success: false,
      message: "تعذر إغلاق طلب المراجعة.",
    };
  }

  await recordAdminAction({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    action: "reject_talent_profile_change",
    outcome: "success",
    target: EVENT_TARGETS.TALENT,
    targetId: request.talent_id,
    metadata: {
      request_id:
        request.id,
      user_id:
        request.user_id,
      previous_status:
        request.status,
      new_status: "rejected",
    },
  });

  revalidateTalentProfileChangePaths(request.talent_id);

  return {
    success: true,
    message: "تم رفض التغييرات والإبقاء على البيانات الحالية.",
  };
}
