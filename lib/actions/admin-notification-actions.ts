"use server";

import { revalidatePath } from "next/cache";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function markAdminNotificationReadAction(
  formData: FormData,
) {
  await requireAdminAccess();

  const notificationId = Number(
    formData.get("notification_id"),
  );

  if (
    !Number.isInteger(notificationId) ||
    notificationId <= 0
  ) {
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
    throw new Error(
      `[markAdminNotificationReadAction] ${error.message}`,
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/notifications");
}

export async function markAllAdminNotificationsReadAction() {
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
    throw new Error(
      `[markAllAdminNotificationsReadAction] ${error.message}`,
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/notifications");
}