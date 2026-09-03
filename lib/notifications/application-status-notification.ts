import type { ApplicationStatus } from "@/lib/applications/status-rules";
import { createAdminClient } from "@/lib/supabase/admin";

type SupportedNotificationStatus = Extract<ApplicationStatus, "shortlisted" | "accepted" | "rejected">;

export async function createApplicationStatusNotification(input: {
  status: SupportedNotificationStatus;
  talentId: string | number;
  applicationId: string | number;
  opportunityId: string | number;
  opportunityTitle?: string | null;
  actorUserId?: string | null;
}) {
  const adminClient = createAdminClient();
  const title = input.status === "accepted"
    ? "Application accepted"
    : input.status === "shortlisted"
      ? "Application shortlisted"
      : "Application update";
  const body = input.status === "accepted"
    ? `Your application${input.opportunityTitle ? ` for ${input.opportunityTitle}` : ""} has been accepted.`
    : input.status === "shortlisted"
      ? `Your application${input.opportunityTitle ? ` for ${input.opportunityTitle}` : ""} has been shortlisted.`
      : `Your application${input.opportunityTitle ? ` for ${input.opportunityTitle}` : ""} was not selected.`;
  const eventType = input.status === "accepted"
    ? "application_accepted"
    : input.status === "shortlisted"
      ? "application_shortlisted"
      : "application_rejected";

  const { data: event, error: eventError } = await adminClient
    .from("events")
    .insert({
      event_type: eventType,
      target_type: "application",
      target_id: String(input.applicationId),
      actor_id: input.actorUserId ?? null,
      metadata: {
        application_id: input.applicationId,
        opportunity_id: input.opportunityId,
        status: input.status,
      },
    })
    .select("id")
    .single();

  if (eventError || !event) {
    console.error("[createApplicationStatusNotification event]", eventError);
    return { ok: false as const, code: "EVENT_INSERT_FAILED" as const };
  }

  const { error: notificationError } = await adminClient
    .from("notifications")
    .insert({
      event_id: event.id,
      recipient_type: "talent",
      recipient_id: String(input.talentId),
      title,
      body,
      is_read: false,
    });

  if (notificationError) {
    console.error("[createApplicationStatusNotification notification]", notificationError);
    return { ok: false as const, code: "NOTIFICATION_INSERT_FAILED" as const };
  }

  return { ok: true as const, eventId: event.id };
}
