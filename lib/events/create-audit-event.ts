import * as Sentry from "@sentry/nextjs";

import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeAuditMetadata } from "./audit-sanitizer";
import type { EventTarget } from "./event-targets";
import type { EventType } from "./event-types";

export async function createAuditEvent({
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
  const adminClient =
    createAdminClient();

  const { data, error } =
    await adminClient
      .from("events")
      .insert({
        event_type: type,
        target_type: target,
        target_id:
          String(targetId),
        actor_id: actorId
          ? String(actorId)
          : null,
        metadata:
          sanitizeAuditMetadata(
            metadata,
          ),
      })
      .select("id")
      .single();

  if (error || !data) {
    const auditError =
      new Error(
        `Audit event insert failed: ${error?.message ?? "unknown error"}`,
      );

    Sentry.captureException(
      auditError,
      {
        tags: {
          subsystem:
            "admin_audit",
          audit_event_type:
            type,
          audit_target:
            target,
        },
        extra: {
          targetId:
            String(targetId),
        },
      },
    );

    throw auditError;
  }

  return data.id;
}
