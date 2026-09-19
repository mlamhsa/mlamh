import { NextRequest, NextResponse } from "next/server";

import {
  requireAdminAccess,
  requireAdminIdentity,
} from "@/lib/auth/require-admin";
import { recordAdminAction } from "@/lib/events/admin-audit";
import { EVENT_TARGETS } from "@/lib/events/event-targets";
import { consumeServerRateLimit } from "@/lib/security/server-rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type MfaAuditMode =
  | "enrollment"
  | "challenge";

type MfaAuditOutcome =
  | "success"
  | "failed";

export async function POST(
  request: NextRequest,
) {
  const identityUser =
    await requireAdminIdentity();

  let mode: MfaAuditMode;
  let outcome:
    MfaAuditOutcome;

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

    if (
      body?.outcome !== "success" &&
      body?.outcome !== "failed"
    ) {
      throw new Error(
        "invalid outcome",
      );
    }

    mode = body.mode;
    outcome = body.outcome;
  } catch {
    await recordAdminAction({
      actorId: identityUser.id,
      actorEmail:
        identityUser.email,
      action:
        "record_admin_mfa_event",
      outcome: "blocked",
      target:
        EVENT_TARGETS.ADMIN,
      targetId: identityUser.id,
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

  if (outcome === "failed") {
    const authClient =
      await createServerSupabaseClient();

    const assurance =
      await authClient.auth.mfa.getAuthenticatorAssuranceLevel();

    if (
      assurance.error ||
      assurance.data
        .currentLevel === "aal2"
    ) {
      await recordAdminAction({
        actorId:
          identityUser.id,
        actorEmail:
          identityUser.email,
        action:
          "admin_mfa_verification_failed",
        outcome: "blocked",
        target:
          EVENT_TARGETS.ADMIN,
        targetId:
          identityUser.id,
        reason:
          assurance.error
            ? "mfa_assurance_lookup_failed"
            : "failed_mfa_event_after_aal2",
      });

      return NextResponse.json(
        {
          recorded: false,
        },
        {
          status:
            assurance.error
              ? 503
              : 409,
          headers: {
            "Cache-Control":
              "no-store",
          },
        },
      );
    }

    let rateLimit;

    try {
      rateLimit =
        await consumeServerRateLimit({
          namespace:
            "admin_mfa_failed_audit",
          identifier:
            identityUser.id,
          limit: 30,
          windowSeconds:
            60 * 60,
        });
    } catch (rateLimitError) {
      console.error(
        "[AdminMfaEvent failed audit rate limit]",
        rateLimitError,
      );

      return NextResponse.json(
        {
          error:
            "MFA audit is temporarily unavailable.",
        },
        {
          status: 503,
        },
      );
    }

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          recorded: false,
        },
        {
          status: 202,
          headers: {
            "Cache-Control":
              "no-store",
          },
        },
      );
    }

    const recorded =
      await recordAdminAction({
        actorId:
          identityUser.id,
        actorEmail:
          identityUser.email,
        action:
          "admin_mfa_verification_failed",
        outcome: "failed",
        target:
          EVENT_TARGETS.ADMIN,
        targetId:
          identityUser.id,
        reason:
          "mfa_verification_failed",
        metadata: {
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

  const verifiedUser =
    await requireAdminAccess();

  const recorded =
    await recordAdminAction({
      actorId: verifiedUser.id,
      actorEmail:
        verifiedUser.email,
      action:
        mode ===
        "enrollment"
          ? "admin_mfa_enrolled"
          : "admin_mfa_verified",
      outcome: "success",
      target:
        EVENT_TARGETS.ADMIN,
      targetId: verifiedUser.id,
      metadata: {
        assurance_level:
          "aal2",
        mfa_factor_type:
          "totp",
        verification_context:
          mode,
      },
    });

  if (!recorded) {
    return NextResponse.json(
      {
        recorded: false,
      },
      {
        status: 503,
        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  }

  const adminClient =
    createAdminClient();
  const {
    data: authUserData,
    error: authUserError,
  } =
    await adminClient.auth.admin.getUserById(
      verifiedUser.id,
    );

  if (authUserError) {
    console.error(
      "[AdminMfaEvent invite lifecycle lookup]",
      authUserError,
    );

    return NextResponse.json(
      {
        recorded: true,
        inviteActivated: false,
      },
      {
        status: 503,
        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  }

  const appMetadata =
    authUserData.user?.app_metadata ??
    {};

  if (
    appMetadata
      .admin_invite_status ===
    "pending"
  ) {
    const completedAt =
      new Date().toISOString();

    const {
      error:
        inviteActivationError,
    } =
      await adminClient.auth.admin.updateUserById(
        verifiedUser.id,
        {
          app_metadata: {
            ...appMetadata,
            admin_invite_status:
              "completed",
            admin_invite_completed_at:
              completedAt,
          },
        },
      );

    if (inviteActivationError) {
      console.error(
        "[AdminMfaEvent invite lifecycle update]",
        inviteActivationError,
      );

      await recordAdminAction({
        actorId:
          verifiedUser.id,
        actorEmail:
          verifiedUser.email,
        action:
          "complete_admin_invite",
        outcome: "failed",
        target:
          EVENT_TARGETS.ADMIN,
        targetId:
          verifiedUser.id,
        reason:
          "invite_activation_state_update_failed",
      });

      return NextResponse.json(
        {
          recorded: true,
          inviteActivated:
            false,
        },
        {
          status: 503,
          headers: {
            "Cache-Control":
              "no-store",
          },
        },
      );
    }

    await recordAdminAction({
      actorId:
        verifiedUser.id,
      actorEmail:
        verifiedUser.email,
      action:
        "complete_admin_invite",
      outcome: "success",
      target:
        EVENT_TARGETS.ADMIN,
      targetId:
        verifiedUser.id,
      metadata: {
        completed_at:
          completedAt,
        activation_assurance:
          "aal2",
      },
    });
  }

  return NextResponse.json(
    {
      recorded: true,
      inviteActivated: true,
    },
    {
      status: 200,
      headers: {
        "Cache-Control":
          "no-store",
      },
    },
  );
}
