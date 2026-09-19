"use server";

import { revalidatePath } from "next/cache";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { recordAdminAction } from "@/lib/events/admin-audit";
import { EVENT_TARGETS } from "@/lib/events/event-targets";
import { createAdminClient } from "@/lib/supabase/admin";

export async function markAdminNotificationReadAction(
  formData: FormData,
) {
  const adminUser =
    await requireAdminAccess();

  const notificationId = Number(
    formData.get("notification_id"),
  );

  if (
    !Number.isInteger(notificationId) ||
    notificationId <= 0
  ) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "mark_admin_notification_read",
      outcome: "blocked",
      target: EVENT_TARGETS.NOTIFICATION,
      targetId: "invalid-input",
      reason: "invalid_notification_id",
    });

    throw new Error(
      "Invalid notification ID.",
    );
  }

  const adminClient =
    createAdminClient();

  const { error } = await adminClient
    .from("notifications")
    .update({
      is_read: true,
    })
    .eq("id", notificationId)
    .eq("recipient_type", "ADMIN");

  if (error) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "mark_admin_notification_read",
      outcome: "failed",
      target: EVENT_TARGETS.NOTIFICATION,
      targetId: notificationId,
      reason: "notification_update_failed",
    });

    throw new Error(
      `[markAdminNotificationReadAction] ${error.message}`,
    );
  }

  await recordAdminAction({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    action: "mark_admin_notification_read",
    outcome: "success",
    target: EVENT_TARGETS.NOTIFICATION,
    targetId: notificationId,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/notifications");
}

export async function markAllAdminNotificationsReadAction() {
  const adminUser =
    await requireAdminAccess();

  const adminClient =
    createAdminClient();

  const { error } = await adminClient
    .from("notifications")
    .update({
      is_read: true,
    })
    .eq("recipient_type", "ADMIN")
    .eq("is_read", false);

  if (error) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "mark_all_admin_notifications_read",
      outcome: "failed",
      target: EVENT_TARGETS.ADMIN,
      targetId: adminUser.id,
      reason: "notification_bulk_update_failed",
    });

    throw new Error(
      `[markAllAdminNotificationsReadAction] ${error.message}`,
    );
  }

  await recordAdminAction({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    action: "mark_all_admin_notifications_read",
    outcome: "success",
    target: EVENT_TARGETS.ADMIN,
    targetId: adminUser.id,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/notifications");
}