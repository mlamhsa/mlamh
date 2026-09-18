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

  try {
    await createAuditEvent({
      type,
      target,
      targetId,
      actorId,
      metadata: {
        action,
        outcome,
        reason:
          reason ?? null,
        actor_email:
          actorEmail ?? null,
        ...metadata,
      },
    });

    return true;
  } catch (error) {
    // Never make an already-completed admin mutation look like it failed
    // only because the audit persistence layer had a separate problem.
    // The failure remains visible in server logs / observability.
    console.error(
      "[recordAdminAction]",
      {
        action,
        outcome,
        target,
        targetId,
        error,
      },
    );

    return false;
  }
}
