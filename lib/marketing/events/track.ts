import { createAdminClient } from "@/lib/supabase/admin";

export type TrackMarketingEventInput = {
  eventName: string;
  userId?: string | null;
  anonymousSessionId?: string | null;
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  content?: string | null;
  term?: string | null;
  referrer?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  occurredAt?: string;
};

export async function trackMarketingEvent(input: TrackMarketingEventInput) {
  const db = createAdminClient();
  const { data, error } = await db.from("marketing_events").insert({
    event_name: input.eventName,
    user_id: input.userId ?? null,
    anonymous_session_id: input.anonymousSessionId ?? null,
    source: input.source ?? null,
    medium: input.medium ?? null,
    campaign: input.campaign ?? null,
    content: input.content ?? null,
    term: input.term ?? null,
    referrer: input.referrer ?? null,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    metadata: input.metadata ?? {},
    occurred_at: input.occurredAt ?? new Date().toISOString(),
  }).select("id").single();

  if (error) throw new Error(`[trackMarketingEvent] ${error.message}`);
  return data;
}
