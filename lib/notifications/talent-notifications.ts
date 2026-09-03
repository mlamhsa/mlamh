import type {
  MarkNotificationReadResult,
  MobileNotification,
  NotificationCategory,
  NotificationsResponse,
} from "@/lib/notifications/notification-contract";
import { createAdminClient } from "@/lib/supabase/admin";

function getCategory(eventType: string | null): NotificationCategory {
  const value = (eventType ?? "").toLowerCase();
  if (value.includes("message")) return "message";
  if (value.includes("invite")) return "invitation";
  if (value.includes("application")) return "application";
  return "system";
}

function getReferenceId(metadata: Record<string, unknown> | null) {
  if (!metadata) return null;

  const candidates = [
    metadata.conversation_id,
    metadata.opportunity_id,
    metadata.application_id,
    metadata.reference_id,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "number" || typeof candidate === "string") {
      return candidate;
    }
  }

  return null;
}

export async function getTalentNotifications(
  userId: string,
): Promise<NotificationsResponse> {
  const adminClient = createAdminClient();

  const { data: talent, error: talentError } = await adminClient
    .from("talents")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (talentError || !talent) {
    return { items: [], unreadCount: 0 };
  }

  const { data, error } = await adminClient
    .from("notifications")
    .select(`
      id,
      title,
      body,
      is_read,
      created_at,
      events (
        event_type,
        metadata
      )
    `)
    .eq("recipient_type", "talent")
    .eq("recipient_id", String(talent.id))
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[getTalentNotifications]", error);
    return { items: [], unreadCount: 0 };
  }

  const items: MobileNotification[] = (data ?? []).map((row) => {
    const event = Array.isArray(row.events) ? row.events[0] : row.events;
    const eventType = event?.event_type ?? null;
    const metadata = (event?.metadata ?? null) as Record<string, unknown> | null;

    return {
      id: row.id,
      title: row.title,
      body: row.body ?? null,
      isRead: row.is_read === true,
      createdAt: row.created_at ?? null,
      category: getCategory(eventType),
      referenceId: getReferenceId(metadata),
      eventType,
    };
  });

  return {
    items,
    unreadCount: items.reduce((count, item) => count + (item.isRead ? 0 : 1), 0),
  };
}

export async function markTalentNotificationRead(
  userId: string,
  notificationId: number,
): Promise<MarkNotificationReadResult> {
  const adminClient = createAdminClient();

  const { data: talent, error: talentError } = await adminClient
    .from("talents")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (talentError || !talent) {
    return { ok: false, code: "NOT_FOUND" };
  }

  const { data, error } = await adminClient
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("recipient_type", "talent")
    .eq("recipient_id", String(talent.id))
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[markTalentNotificationRead]", error);
    return { ok: false, code: "UPDATE_FAILED" };
  }

  if (!data) return { ok: false, code: "NOT_FOUND" };
  return { ok: true, id: data.id };
}
