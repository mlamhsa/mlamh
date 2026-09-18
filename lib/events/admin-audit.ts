import { createAuditEvent } from "./create-audit-event";
import { EVENT_TYPES } from "./event-types";
import type { EventTarget } from "./event-targets";

export type AdminAuditOutcome =
  | "success"
  | "blocked"
  | "failed"
  | "noop";

export async function recordAdminAction({
  actorId,
  actorEmail,
  action,
  outcome,
  target,
  targetId,
  reason,
  metadata = {},
}: {
  actorId: string;
  actorEmail?: string | null;
  action: string;
  outcome: AdminAuditOutcome;
  target: EventTarget;
  targetId: string | number;
  reason?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const type =
    outcome === "success"
      ? EVENT_TYPES.admin_action_success
      : outcome === "blocked"
        ? EVENT_TYPES.admin_action_blocked
        : outcome === "failed"
          ? EVENT_TYPES.admin_action_failed
          : EVENT_TYPES.admin_action_noop;

  await createAuditEvent({
    type,
    target,
    targetId,
    actorId,
    metadata: {
      action,
      outcome,
      reason: reason ?? null,
      actor_email:
        actorEmail ?? null,
      ...metadata,
    },
  });
}
