import { cookies } from "next/headers";

import { MARKETING_ATTRIBUTION_COOKIE, parseMarketingAttributionCookie } from "@/lib/marketing/attribution/context";
import { dispatchMarketingAutomationEvent } from "@/lib/marketing/automation/dispatch";
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

async function getRequestAttributionContext() {
  try {
    const cookieStore = await cookies();
    return parseMarketingAttributionCookie(
      cookieStore.get(MARKETING_ATTRIBUTION_COOKIE)?.value,
    );
  } catch {
    return parseMarketingAttributionCookie(null);
  }
}

export async function trackMarketingEvent(input: TrackMarketingEventInput) {
  const db = createAdminClient();
  const requestAttribution = await getRequestAttributionContext();
  const metadata = {
    ...(input.metadata ?? {}),
    ...(requestAttribution.landingPath && !(input.metadata && "landing_path" in input.metadata)
      ? { landing_path: requestAttribution.landingPath }
      : {}),
  };
  const anonymousSessionId = input.anonymousSessionId ?? requestAttribution.anonymousSessionId ?? null;
  const eventPayload = {
    event_name: input.eventName,
    user_id: input.userId ?? null,
    anonymous_session_id: anonymousSessionId,
    source: input.source ?? null,
    medium: input.medium ?? null,
    campaign: input.campaign ?? null,
    content: input.content ?? null,
    term: input.term ?? null,
    referrer: input.referrer ?? null,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    metadata,
    occurred_at: input.occurredAt ?? new Date().toISOString(),
  };

  const { data, error } = await db.from("marketing_events").insert(eventPayload).select("id").single();
  if (error) throw new Error(`[trackMarketingEvent] ${error.message}`);

  try {
    await dispatchMarketingAutomationEvent(input.eventName, {
      ...metadata,
      source: input.source ?? null,
      medium: input.medium ?? null,
      campaign: input.campaign ?? null,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      user_id: input.userId ?? null,
      anonymous_session_id: anonymousSessionId,
    });
  } catch (automationError) {
    console.error("[trackMarketingEvent automation]", automationError);
  }

  return data;
}
