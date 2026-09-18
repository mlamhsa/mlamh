import { NextRequest, NextResponse } from "next/server";

import { recordAdminAction } from "@/lib/events/admin-audit";
import { EVENT_TARGETS } from "@/lib/events/event-targets";
import { requirePermission } from "@/lib/rbac/guards";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { consumeServerRateLimit } from "@/lib/security/server-rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

const EXPORT_LIMIT = 5000;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function csvCell(value: unknown) {
  const raw =
    value === null ||
    value === undefined
      ? ""
      : String(value);

  const formulaSafe =
    /^[=+\-@]/.test(raw)
      ? `'${raw}`
      : raw;

  return `"${formulaSafe.replaceAll('"', '""')}"`;
}

function getPeriodStart(
  value: string | null,
) {
  const milliseconds =
    value === "24h"
      ? 24 * 60 * 60 * 1000
      : value === "7d"
        ? 7 * 24 * 60 * 60 * 1000
        : value === "30d"
          ? 30 * 24 * 60 * 60 * 1000
          : null;

  return milliseconds
    ? new Date(
        Date.now() -
          milliseconds,
      ).toISOString()
    : null;
}

export async function GET(
  request: NextRequest,
) {
  const adminUser =
    await requirePermission(
      PERMISSIONS.ADMINS_VIEW,
    );

  const rateLimit =
    await consumeServerRateLimit({
      namespace:
        "admin_audit_export",
      identifier:
        adminUser.id,
      limit: 10,
      windowSeconds:
        60 * 60,
    });

  if (!rateLimit.allowed) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail:
        adminUser.email,
      action:
        "export_admin_audit_log",
      outcome: "blocked",
      target:
        EVENT_TARGETS.ADMIN,
      targetId: adminUser.id,
      reason:
        "audit_export_rate_limited",
      metadata: {
        retry_after_seconds:
          rateLimit.retryAfterSeconds,
      },
    });

    return NextResponse.json(
      {
        error:
          "Audit export rate limit exceeded.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            rateLimit.retryAfterSeconds,
          ),
        },
      },
    );
  }

  const params =
    request.nextUrl.searchParams;
  const target =
    params.get("target")?.trim() ??
    "";
  const event =
    params.get("event")?.trim() ??
    "";
  const actor =
    params.get("actor")?.trim() ??
    "";
  const q =
    params
      .get("q")
      ?.trim()
      .toLowerCase() ?? "";
  const period =
    params.get("period");
  const periodStart =
    getPeriodStart(period);

  if (
    actor &&
    !UUID_PATTERN.test(actor)
  ) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail:
        adminUser.email,
      action:
        "export_admin_audit_log",
      outcome: "blocked",
      target:
        EVENT_TARGETS.ADMIN,
      targetId: adminUser.id,
      reason:
        "invalid_actor_filter",
    });

    return NextResponse.json(
      {
        error:
          "Invalid actor filter.",
      },
      {
        status: 400,
      },
    );
  }

  const adminClient =
    createAdminClient();

  let query = adminClient
    .from("events")
    .select(
      `
        id,
        event_type,
        target_type,
        target_id,
        actor_id,
        metadata,
        created_at
      `,
    )
    .order(
      "created_at",
      {
        ascending: false,
      },
    )
    .limit(
      EXPORT_LIMIT,
    );

  if (actor) {
    query = query.eq(
      "actor_id",
      actor,
    );
  }

  if (target) {
    query = query.eq(
      "target_type",
      target,
    );
  }

  if (event) {
    query = query.eq(
      "event_type",
      event,
    );
  }

  if (periodStart) {
    query = query.gte(
      "created_at",
      periodStart,
    );
  }

  if (
    q &&
    UUID_PATTERN.test(q)
  ) {
    query = query.or(
      `actor_id.eq.${q},target_id.eq.${q}`,
    );
  }

  const {
    data,
    error,
  } = await query;

  if (error) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail:
        adminUser.email,
      action:
        "export_admin_audit_log",
      outcome: "failed",
      target:
        EVENT_TARGETS.ADMIN,
      targetId: adminUser.id,
      reason:
        "audit_export_query_failed",
      metadata: {
        target_filter:
          target || null,
        event_filter:
          event || null,
        actor_filter:
          actor || null,
        period_filter:
          period || null,
      },
    });

    return NextResponse.json(
      {
        error:
          "Audit export could not be generated.",
      },
      {
        status: 500,
      },
    );
  }

  const rows =
    (data ?? []).filter(
      (item) => {
        if (
          !q ||
          UUID_PATTERN.test(q)
        ) {
          return true;
        }

        const metadataText =
          item.metadata
            ? JSON.stringify(
                item.metadata,
              )
            : "";

        return [
          item.event_type,
          item.target_type,
          item.target_id,
          item.actor_id,
          metadataText,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);
      },
    );

  const header = [
    "id",
    "created_at",
    "event_type",
    "target_type",
    "target_id",
    "actor_id",
    "actor_email",
    "action",
    "outcome",
    "reason",
    "metadata_json",
  ];

  const lines = [
    header
      .map(csvCell)
      .join(","),
    ...rows.map((item) => {
      const metadata =
        item.metadata &&
        typeof item.metadata ===
          "object" &&
        !Array.isArray(
          item.metadata,
        )
          ? item.metadata as Record<
              string,
              unknown
            >
          : {};

      return [
        item.id,
        item.created_at,
        item.event_type,
        item.target_type,
        item.target_id,
        item.actor_id,
        metadata.actor_email,
        metadata.action,
        metadata.outcome,
        metadata.reason,
        JSON.stringify(
          item.metadata ?? {},
        ),
      ]
        .map(csvCell)
        .join(",");
    }),
  ];

  await recordAdminAction({
    actorId: adminUser.id,
    actorEmail:
      adminUser.email,
    action:
      "export_admin_audit_log",
    outcome: "success",
    target:
      EVENT_TARGETS.ADMIN,
    targetId: adminUser.id,
    metadata: {
      exported_rows:
        rows.length,
      export_limit:
        EXPORT_LIMIT,
      target_filter:
        target || null,
      event_filter:
        event || null,
      actor_filter:
        actor || null,
      period_filter:
        period || null,
      free_text_filter:
        q && !UUID_PATTERN.test(q)
          ? true
          : false,
    },
  });

  const date =
    new Date()
      .toISOString()
      .slice(
        0,
        10,
      );

  return new NextResponse(
    `\uFEFF${lines.join("\n")}`,
    {
      status: 200,
      headers: {
        "Content-Type":
          "text/csv; charset=utf-8",
        "Content-Disposition":
          `attachment; filename="mlamh-audit-${date}.csv"`,
        "Cache-Control":
          "private, no-store",
        "X-Content-Type-Options":
          "nosniff",
      },
    },
  );
}
