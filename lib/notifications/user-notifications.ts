import type {
  MarkNotificationReadResult,
  MobileNotification,
  NotificationCategory,
  NotificationTarget,
  NotificationsResponse,
} from "@/lib/notifications/notification-contract";
import { createAdminClient } from "@/lib/supabase/admin";

type RecipientContext =
  | { type: "talent"; id: string }
  | { type: "publisher"; id: string };

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
  const keys = ["conversation_id", "opportunity_id", "application_id", "reference_id"];
  for (const key of keys) {
    const value = readMetadataId(metadata, key);
    if (value !== null) return value;
  }
  return null;
}

function getTarget(
  recipient: RecipientContext,
  category: NotificationCategory,
  metadata: Record<string, unknown> | null,
): NotificationTarget {
  const conversationId = readMetadataId(metadata, "conversation_id");
  const opportunityId = readMetadataId(metadata, "opportunity_id");

  if (category === "message" && conversationId !== null) {
    return { type: "conversation", id: conversationId };
  }

  if (recipient.type === "publisher" && category === "application" && opportunityId !== null) {
    return { type: "publisher_opportunity", id: opportunityId };
  }

  if (recipient.type === "talent" && category === "application") {
    return { type: "talent_applications" };
  }

  if (recipient.type === "talent" && category === "invitation" && opportunityId !== null) {
    return { type: "opportunity", id: opportunityId };
  }

  return { type: "none" };
}

async function resolveRecipient(userId: string): Promise<RecipientContext | null> {
  const adminClient = createAdminClient();

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, account_type")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError || !profile) return null;

  if (profile.account_type === "talent") {
    const { data: talent, error } = await adminClient
      .from("talents")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !talent) return null;
    return { type: "talent", id: String(talent.id) };
  }

  if (profile.account_type === "publisher") {
    const { data: publisher, error } = await adminClient
      .from("publishers")
      .select("id")
      .eq("profile_id", profile.id)
      .maybeSingle();
    if (error || !publisher) return null;
    return { type: "publisher", id: String(publisher.id) };
  }

  return null;
}

export async function getUserNotifications(userId: string): Promise<NotificationsResponse> {
  const recipient = await resolveRecipient(userId);
  if (!recipient) return { items: [], unreadCount: 0 };

  const adminClient = createAdminClient();
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
    .eq("recipient_type", recipient.type)
    .eq("recipient_id", recipient.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[getUserNotifications]", error);
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
      target: getTarget(recipient, category, metadata),
    };
  });

  return {
    items,
    unreadCount: items.reduce((count, item) => count + (item.isRead ? 0 : 1), 0),
  };
}

export async function markUserNotificationRead(
  userId: string,
  notificationId: number,
): Promise<MarkNotificationReadResult> {
  const recipient = await resolveRecipient(userId);
  if (!recipient) return { ok: false, code: "NOT_FOUND" };

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("recipient_type", recipient.type)
    .eq("recipient_id", recipient.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[markUserNotificationRead]", error);
    return { ok: false, code: "UPDATE_FAILED" };
  }

  if (!data) return { ok: false, code: "NOT_FOUND" };
  return { ok: true, id: data.id };
}
