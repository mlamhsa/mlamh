import { createAdminClient } from "@/lib/supabase/admin";
import type { EventTarget } from "../event-targets";
import type { EventType } from "../event-types";

function buildNotification(
  type: EventType,
  metadata: Record<string, unknown>
) {
  switch (type) {
    case "publisher_verified":
      return {
        title: "Publisher approved",
        body: "Your publisher account has been approved.",
      };

    case "opportunity_pending_review":
      return {
        title: "New opportunity waiting for review",
        body: String(metadata.title ?? ""),
      };

    case "opportunity_published":
      return {
        title: "Opportunity approved",
        body: String(metadata.title ?? ""),
      };

    case "opportunity_rejected":
      return {
        title: "Opportunity rejected",
        body: String(metadata.title ?? ""),
      };

    case "opportunity_needs_changes":
      return {
        title: "Opportunity needs changes",
        body: String(metadata.title ?? ""),
      };

    case "application_created":
      return {
        title: "New application received",
        body: "",
      };

    case "application_accepted":
      return {
        title: "Application accepted",
        body: "",
      };

    case "application_rejected":
      return {
        title: "Application rejected",
        body: "",
      };

    default:
      return null;
  }
}

export class NotificationHandler {
  static async handle({
    eventId,
    type,
    target,
    targetId,
    metadata,
  }: {
    eventId: number;
    type: EventType;
    target: EventTarget;
    targetId: string | number;
    metadata: Record<string, unknown>;
  }) {
    const notification = buildNotification(type, metadata);

    if (!notification) return;

    const adminClient = createAdminClient();

    const { error } = await adminClient.from("notifications").insert({
      event_id: eventId,
      recipient_type: target,
      recipient_id: String(targetId),
      title: notification.title,
      body: notification.body,
    });

    if (error) {
      console.error("[NotificationHandler]", error.message);
    }
  }
}