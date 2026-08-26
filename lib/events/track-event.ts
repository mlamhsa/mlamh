import { createAdminClient } from "@/lib/supabase/admin";

export type AnalyticsEventType =
  | "signup"
  | "profile_completed"
  | "profile_submitted"
  | "profile_approved"
  | "opportunity_viewed"
  | "application_started"
  | "application_submitted"
  | "application_accepted"
  | "conversation_started"
  | "opportunity_shared"
  | "profile_shared"
  | "talent_returned"
  | "publisher_returned"
  | "casting_service_lead"
  | "featured_clicked"
  | "featured_purchase_started"
  | "featured_purchase_completed";

export type AnalyticsTargetType =
  | "talent"
  | "publisher"
  | "opportunity"
  | "application"
  | "conversation"
  | "profile"
  | "system";

export async function trackEvent({
  type,
  target,
  targetId,
  actorId = null,
  metadata = {},
}: {
  type: AnalyticsEventType;
  target: AnalyticsTargetType;
  targetId: string | number;
  actorId?: string | number | null;
  metadata?: Record<string, unknown>;
}) {
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("events")
    .insert({
      event_type: type,
      target_type: target,
      target_id: String(targetId),
      actor_id:
        actorId === null ||
        actorId === undefined
          ? null
          : String(actorId),
      metadata,
    });

  if (error) {
    console.error("[trackEvent]", {
      type,
      target,
      targetId,
      message: error.message,
      code: error.code,
    });
  }
}