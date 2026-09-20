import { redirect } from "next/navigation";

import { hasValidActiveAdminAssignment } from "@/lib/rbac/admin-access-policy";
import { recordAdminAction } from "@/lib/events/admin-audit";
import { EVENT_TARGETS } from "@/lib/events/event-targets";
import { consumeServerRateLimit } from "@/lib/security/server-rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const ADMIN_LOGIN_PATH = "/ar/login";
const ADMIN_MFA_PATH = "/admin-mfa";

function isMissingOrStaleAuthSession(error: unknown) {
  if (!error) return false;

  const authError = error as { code?: string; message?: string };
  const code = authError.code?.toLowerCase() ?? "";
  const message = authError.message?.toLowerCase() ?? String(error).toLowerCase();

  return (
    code === "refresh_token_not_found" ||
    code === "session_not_found" ||
    message.includes("refresh token not found") ||
    message.includes("invalid refresh token") ||
    message.includes("auth session missing")
  );
}

async function requireAdminIdentityInternal() {
  const authClient =
    await createServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } =
    await authClient.auth.getUser();

  if (userError || !user) {
    // Expired, revoked, or already-rotated sessions are expected unauthenticated
    // states. Do not surface them as runtime failures from protected routes.
    // Proxy owns cookie refresh/cleanup; this guard remains fail-closed.
    if (!userError || isMissingOrStaleAuthSession(userError)) {
      redirect(ADMIN_LOGIN_PATH);
    }

    console.error("[requireAdminIdentity auth]", userError);
    redirect(ADMIN_LOGIN_PATH);
  }

  const adminClient =
    createAdminClient();

  const [
    {
      data: profile,
      error: profileError,
    },
    {
      data: adminRegistry,
      error: adminRegistryError,
    },
    {
      data: roleAssignments,
      error: roleAssignmentsError,
    },
  ] = await Promise.all([
    adminClient
      .from("profiles")
      .select("account_type")
      .eq("user_id", user.id)
      .maybeSingle(),
    adminClient
      .from("admin_users")
      .select("id, role")
      .eq("id", user.id)
      .maybeSingle(),
    adminClient
      .from("user_roles")
      .select(`
        role_id,
        roles (
          key
        )
      `)
      .eq("user_id", user.id),
  ]);

  // Admin identity fails closed and requires all three layers:
  // 1) the profile is an admin profile,
  // 2) the account is present in the explicit admin registry and active,
  // 3) exactly one active RBAC role is assigned.
  //
  // RBAC remains the permission source of truth; the registry remains the
  // active/revoked gate. This preserves legacy registry compatibility while
  // rejecting duplicate, revoked, or prepared-role access.
  const assignedRoleKeys =
    (roleAssignments ?? []).map(
      (assignment) => {
        const role =
          Array.isArray(
            assignment.roles,
          )
            ? assignment.roles[0]
            : assignment.roles;

        return role?.key;
      },
    );

  const activeAssignmentValid =
    adminRegistry &&
    hasValidActiveAdminAssignment(
      adminRegistry.role,
      assignedRoleKeys,
    );

  if (
    profileError ||
    adminRegistryError ||
    roleAssignmentsError ||
    !profile ||
    profile.account_type !==
      "admin" ||
    !adminRegistry ||
    !roleAssignments ||
    !activeAssignmentValid
  ) {
    const lookupFailed =
      Boolean(
        profileError ||
          adminRegistryError ||
          roleAssignmentsError,
      );

    const reason =
      profileError
        ? "profile_lookup_failed"
        : adminRegistryError
          ? "admin_registry_lookup_failed"
          : roleAssignmentsError
            ? "role_assignment_lookup_failed"
            : !profile ||
                profile.account_type !==
                  "admin"
              ? "profile_not_admin"
              : !adminRegistry
                ? "admin_registry_missing"
                : "invalid_admin_role_assignment";

    // A valid authenticated account can still be unauthorized for admin
    // access. Throttle the audit write so a blocked account cannot flood the
    // events table by repeatedly requesting admin routes. Authorization stays
    // fail-closed regardless of rate-limit availability.
    let shouldRecordIdentityGate =
      false;

    try {
      const auditRateLimit =
        await consumeServerRateLimit({
          namespace:
            "admin_identity_gate_audit",
          identifier: user.id,
          limit: 30,
          windowSeconds:
            60 * 60,
        });

      shouldRecordIdentityGate =
        auditRateLimit.allowed;
    } catch (rateLimitError) {
      console.error(
        "[requireAdminIdentity identity gate audit rate limit]",
        rateLimitError,
      );
    }

    if (shouldRecordIdentityGate) {
      await recordAdminAction({
        actorId: user.id,
        actorEmail:
          user.email,
        action:
          "admin_identity_gate",
        outcome: lookupFailed
          ? "failed"
          : "blocked",
        target:
          EVENT_TARGETS.AUTH_USER,
        targetId: user.id,
        reason,
        metadata: {
          registry_present:
            Boolean(
              adminRegistry,
            ),
          assigned_role_count:
            assignedRoleKeys.filter(
              Boolean,
            ).length,
        },
      });
    }

    redirect(ADMIN_LOGIN_PATH);
  }

  return {
    user,
    authClient,
  };
}

export async function requireAdminIdentity() {
  const { user } =
    await requireAdminIdentityInternal();

  return user;
}

export async function requireAdminAccess() {
  const {
    user,
    authClient,
  } =
    await requireAdminIdentityInternal();

  const assurance =
    await authClient.auth.mfa.getAuthenticatorAssuranceLevel();

  // Admin access fails closed: a valid admin identity alone is not enough.
  // The session must also prove a verified second factor (AAL2).
  if (
    assurance.error ||
    assurance.data
      .currentLevel !== "aal2"
  ) {
    redirect(
      ADMIN_MFA_PATH,
    );
  }

  // A newly invited admin is not fully activated until the successful AAL2
  // flow has also persisted its server-owned invite lifecycle marker. This
  // prevents a partial Auth-metadata failure from granting normal admin-route
  // access while the account still appears pending in the Access Center.
  if (
    user.app_metadata
      ?.admin_invite_status ===
    "pending"
  ) {
    redirect(
      ADMIN_MFA_PATH,
    );
  }

  return user;
}
