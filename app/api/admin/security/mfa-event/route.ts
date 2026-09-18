import { NextRequest, NextResponse } from "next/server";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { recordAdminAction } from "@/lib/events/admin-audit";
import { EVENT_TARGETS } from "@/lib/events/event-targets";

type MfaAuditMode =
  | "enrollment"
  | "challenge";

export async function POST(
  request: NextRequest,
) {
  const adminUser =
    await requireAdminAccess();

  let mode: MfaAuditMode;

  try {
    const body =
      await request.json();

    if (
      body?.mode !== "enrollment" &&
      body?.mode !== "challenge"
    ) {
      throw new Error(
        "invalid mode",
      );
    }

    mode = body.mode;
  } catch {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail:
        adminUser.email,
      action:
        "record_admin_mfa_event",
      outcome: "blocked",
      target:
        EVENT_TARGETS.ADMIN,
      targetId: adminUser.id,
      reason:
        "invalid_mfa_audit_payload",
    });

    return NextResponse.json(
      {
        error:
          "Invalid MFA audit payload.",
      },
      {
        status: 400,
      },
    );
  }

  const recorded =
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail:
        adminUser.email,
      action:
        mode ===
        "enrollment"
          ? "admin_mfa_enrolled"
          : "admin_mfa_verified",
      outcome: "success",
      target:
        EVENT_TARGETS.ADMIN,
      targetId: adminUser.id,
      metadata: {
        assurance_level:
          "aal2",
        mfa_factor_type:
          "totp",
        verification_context:
          mode,
      },
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
