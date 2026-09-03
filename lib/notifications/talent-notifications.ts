import type {
  MarkNotificationReadResult,
  MobileNotification,
  NotificationCategory,
  NotificationTarget,
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

function readMetadataId(
  metadata: Record<string, unknown> | null,
  key: string,
): string | number | null {
  if (!metadata) return null;
  const value = metadata[key];
  return typeof value === "string" || typeof value === "number" ? value : null;
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

function getTarget(
  category: NotificationCategory,
  metadata: Record<string, unknown> | null,
): NotificationTarget {
  const conversationId = readMetadataId(metadata, "conversation_id");
  const opportunityId = readMetadataId(metadata, "opportunity_id");

  if (category === "message" && conversationId !== null) {
    return { type: "conversation", id: conversationId };
  }
  if (category === "application") return { type: "talent_applications" };
  if (category === "invitation" && opportunityId !== null) {
    return { type: "opportunity", id: opportunityId };
  }
  return { type: "none" };
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
    const category = getCategory(eventType);

    return {
      id: row.id,
      title: row.title,
      body: row.body ?? null,
      isRead: row.is_read === true,
      createdAt: row.created_at ?? null,
      category,
      referenceId: getReferenceId(metadata),
      eventType,
      target: getTarget(category, metadata),
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
