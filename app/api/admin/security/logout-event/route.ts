import { NextRequest, NextResponse } from "next/server";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { recordAdminAction } from "@/lib/events/admin-audit";
import { EVENT_TARGETS } from "@/lib/events/event-targets";

type LogoutAuditOutcome =
  | "requested"
  | "failed";

export async function POST(
  request: NextRequest,
) {
  const adminUser =
    await requireAdminAccess();

  let outcome:
    LogoutAuditOutcome;

  try {
    const body =
      await request.json();

    if (
      body?.outcome !== "requested" &&
      body?.outcome !== "failed"
    ) {
      throw new Error(
        "invalid outcome",
      );
    }

    outcome = body.outcome;
  } catch {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail:
        adminUser.email,
      action:
        "record_admin_logout_event",
      outcome: "blocked",
      target:
        EVENT_TARGETS.ADMIN,
      targetId: adminUser.id,
      reason:
        "invalid_logout_audit_payload",
    });

    return NextResponse.json(
      {
        error:
          "Invalid logout audit payload.",
      },
      {
        status: 400,
        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  }

  const recorded =
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail:
        adminUser.email,
      action:
        outcome ===
        "requested"
          ? "admin_logout_requested"
          : "admin_logout_failed",
      outcome:
        outcome ===
        "requested"
          ? "success"
          : "failed",
      target:
        EVENT_TARGETS.ADMIN,
      targetId: adminUser.id,
      reason:
        outcome ===
        "failed"
          ? "browser_signout_failed"
          : null,
    });

  return NextResponse.json(
    {
      recorded,
    },
    {
      status: recorded
        ? 200
        : 503,
      headers: {
        "Cache-Control":
          "no-store",
      },
    },
  );
}
