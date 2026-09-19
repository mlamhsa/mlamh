"use server";

import { revalidatePath } from "next/cache";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { recordAdminAction } from "@/lib/events/admin-audit";

import {
  createEvent,
  EVENT_TARGETS,
  EVENT_TYPES,
} from "@/lib/events";

import { createAdminClient } from "@/lib/supabase/admin";

export async function reviewReportedMessageAction(
  formData: FormData,
) {
  const adminUser =
    await requireAdminAccess();

  const messageId = Number(
    formData.get("message_id"),
  );

  const conversationId = Number(
    formData.get("conversation_id"),
  );

  const adminNote = String(
    formData.get("admin_note") ?? "",
  ).trim();

  if (
    !Number.isInteger(messageId) ||
    messageId <= 0
  ) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "review_reported_message",
      outcome: "blocked",
      target: EVENT_TARGETS.MESSAGE,
      targetId: "invalid-input",
      reason: "invalid_message_id",
    });

    throw new Error(
      "Invalid message ID.",
    );
  }

  if (
    !Number.isInteger(conversationId) ||
    conversationId <= 0
  ) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "review_reported_message",
      outcome: "blocked",
      target: EVENT_TARGETS.MESSAGE,
      targetId: messageId,
      reason: "invalid_conversation_id",
    });

    throw new Error(
      "Invalid conversation ID.",
    );
  }

  const adminClient =
    createAdminClient();

  /*
   * نجلب Snapshot قبل التعديل
   * حتى نسجل بيانات مفيدة في Audit Log.
   */
  const {
    data: messageSnapshot,
    error: messageSnapshotError,
  } = await adminClient
    .from("messages")
    .select(`
      id,
      conversation_id,
      sender_user_id,
      reported_at,
      report_reason,
      report_reviewed_at
    `)
    .eq(
      "id",
      messageId,
    )
    .eq(
      "conversation_id",
      conversationId,
    )
    .maybeSingle();

  if (messageSnapshotError) {
    console.error(
      "[reviewReportedMessageAction snapshot]",
      messageSnapshotError,
    );

    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "review_reported_message",
      outcome: "failed",
      target: EVENT_TARGETS.MESSAGE,
      targetId: messageId,
      reason: "message_snapshot_load_failed",
      metadata: {
        conversation_id:
          conversationId,
      },
    });

    throw new Error(
      "Unable to load reported message.",
    );
  }

  if (!messageSnapshot) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "review_reported_message",
      outcome: "failed",
      target: EVENT_TARGETS.MESSAGE,
      targetId: messageId,
      reason: "reported_message_not_found",
      metadata: {
        conversation_id:
          conversationId,
      },
    });

    throw new Error(
      "Reported message not found.",
    );
  }

  if (
    !messageSnapshot.reported_at
  ) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "review_reported_message",
      outcome: "blocked",
      target: EVENT_TARGETS.MESSAGE,
      targetId: messageId,
      reason: "message_not_reported",
      metadata: {
        conversation_id:
          conversationId,
      },
    });

    throw new Error(
      "This message has not been reported.",
    );
  }

  if (
    messageSnapshot.report_reviewed_at
  ) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "review_reported_message",
      outcome: "noop",
      target: EVENT_TARGETS.MESSAGE,
      targetId: messageId,
      reason: "report_already_reviewed",
      metadata: {
        conversation_id:
          conversationId,
        reviewed_at:
          messageSnapshot.report_reviewed_at,
      },
    });

    throw new Error(
      "This report has already been reviewed.",
    );
  }

  const reviewedAt =
    new Date().toISOString();

  const {
    data,
    error,
  } = await adminClient
    .from("messages")
    .update({
      report_reviewed_at:
        reviewedAt,

      report_reviewed_by:
        adminUser.id,

      report_admin_note:
        adminNote || null,
    })
    .eq(
      "id",
      messageId,
    )
    .eq(
      "conversation_id",
      conversationId,
    )
    .not(
      "reported_at",
      "is",
      null,
    )
    .is(
      "report_reviewed_at",
      null,
    )
    .select("id")
    .maybeSingle();

  if (error) {
    console.error(
      "[reviewReportedMessageAction]",
      error,
    );

    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "review_reported_message",
      outcome: "failed",
      target: EVENT_TARGETS.MESSAGE,
      targetId: messageId,
      reason: "message_report_update_failed",
      metadata: {
        conversation_id:
          conversationId,
      },
    });

    throw new Error(
      "Unable to review reported message.",
    );
  }

  if (!data) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "review_reported_message",
      outcome: "noop",
      target: EVENT_TARGETS.MESSAGE,
      targetId: messageId,
      reason: "message_report_not_updated",
      metadata: {
        conversation_id:
          conversationId,
      },
    });

    throw new Error(
      "Reported message not found or already reviewed.",
    );
  }

  /*
   * تسجيل العملية في Audit Log.
   *
   * لا نفشل مراجعة البلاغ إذا تعطل
   * تسجيل الـevent؛ لأن تحديث البلاغ
   * نفسه تم بنجاح بالفعل.
   */
  try {
    await createEvent({
      type:
        EVENT_TYPES.message_report_reviewed,

      target:
        EVENT_TARGETS.ADMIN,

      targetId:
        "admin",

      actorId:
        adminUser.id,

      metadata: {
        messageId,
        conversationId,

        senderUserId:
          messageSnapshot.sender_user_id,

        reportedAt:
          messageSnapshot.reported_at,

        reportReason:
          messageSnapshot.report_reason ??
          null,

        reviewedAt,

        adminNote:
          adminNote || null,

        locale: "ar",
      },
    });
  } catch (eventError) {
    console.error(
      "[reviewReportedMessageAction event]",
      eventError,
    );
  }

  await recordAdminAction({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    action: "review_reported_message",
    outcome: "success",
    target: EVENT_TARGETS.MESSAGE,
    targetId: messageId,
    metadata: {
      conversation_id:
        conversationId,
      sender_user_id:
        messageSnapshot.sender_user_id,
      reported_at:
        messageSnapshot.reported_at,
      report_reason:
        messageSnapshot.report_reason ??
        null,
      reviewed_at:
        reviewedAt,
      admin_note:
        adminNote || null,
    },
  });

  revalidatePath(
    "/admin",
  );

  revalidatePath(
    "/admin/messages",
  );

  revalidatePath(
    `/admin/messages/${conversationId}`,
  );

  revalidatePath(
    "/admin/audit-log",
  );
}