import { createAdminClient } from "@/lib/supabase/admin";
import { NotificationHandler } from "./handlers/NotificationHandler";
import { EmailHandler } from "./handlers/EmailHandler";
import type { EventTarget } from "./event-targets";
import type { EventType } from "./event-types";

export async function createEvent({
  type,
  target,
  targetId,
  actorId = null,
  metadata = {},
}: {
  type: EventType;
  target: EventTarget;
  targetId: string | number;
  actorId?: string | number | null;
  metadata?: Record<string, unknown>;
}) {
  const adminClient = createAdminClient();

  const { data: event, error } = await adminClient
    .from("events")
    .insert({
      event_type: type,
      target_type: target,
      target_id: String(targetId),
      actor_id: actorId ? String(actorId) : null,
      metadata,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[createEvent]", error.message);
    return;
  }

  await NotificationHandler.handle({
    eventId: event.id,
    type,
    target,
    targetId,
    metadata,
  });

  await EmailHandler.handle({
    type,
    target,
    targetId,
    metadata,
  });
}