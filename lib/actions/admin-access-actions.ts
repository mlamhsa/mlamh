"use server";

import { randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAuditEvent } from "@/lib/events/create-audit-event";
import { EVENT_TARGETS } from "@/lib/events/event-targets";
import { EVENT_TYPES } from "@/lib/events/event-types";
import {
  crossesSuperAdminBoundary,
  isAssignableAdminRole,
} from "@/lib/rbac/admin-access-policy";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { requirePermission } from "@/lib/rbac/guards";
import { userHasPermission } from "@/lib/rbac/helpers";
import { ROLES, type RoleKey } from "@/lib/rbac/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { consumeServerRateLimit } from "@/lib/security/server-rate-limit";

type Locale = "ar" | "en";

type RoleAssignmentRow = {
  role_id: number;
  roles:
    | { key?: string | null }
    | { key?: string | null }[]
    | null;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getLocale(
  formData: FormData,
): Locale {
  return formData.get("locale") === "en"
    ? "en"
    : "ar";
}

function getInviteEmail(
  formData: FormData,
) {
  const value = String(
    formData.get("email") ?? "",
  )
    .trim()
    .toLowerCase();

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      value,
    ) ||
    value.length > 254
  ) {
    throw new Error(
      "Invalid admin email.",
    );
  }

  return value;
}

function getTargetUserId(
  formData: FormData,
) {
  const value = String(
    formData.get("admin_id") ?? "",
  ).trim();

  if (!UUID_PATTERN.test(value)) {
    throw new Error(
      "Invalid admin user id.",
    );
  }

  return value;
}

function getRoleKey(
  formData: FormData,
): RoleKey {
  const value = String(
    formData.get("role_key") ?? "",
  );

  if (!isAssignableAdminRole(value)) {
    throw new Error(
      "Invalid admin role.",
    );
  }

  return value;
}

function accessCenterUrl(
  locale: Locale,
  params: Record<string, string>,
) {
  const query = new URLSearchParams({
    lang: locale,
    ...params,
  }).toString();

  return `/admin/admins?${query}`;
}

function extractRoleKey(
  assignment: RoleAssignmentRow,
) {
  const role = Array.isArray(
    assignment.roles,
  )
    ? assignment.roles[0]
    : assignment.roles;

  return role?.key?.trim() || null;
}

async function getAdminRoleAssignments(
  userId: string,
) {
  const adminClient =
    createAdminClient();

  const { data, error } =
    await adminClient
      .from("user_roles")
      .select(
        `
          role_id,
          roles (
            key
          )
        `,
      )
      .eq("user_id", userId);

  if (error) {
    throw new Error(
      `Unable to load admin roles: ${error.message}`,
    );
  }

  return (
    (data ?? []) as RoleAssignmentRow[]
  );
}

async function countSuperAdmins() {
  const adminClient =
    createAdminClient();

  const {
    data: superAdminRole,
    error: roleError,
  } = await adminClient
    .from("roles")
    .select("id")
    .eq("key", ROLES.SUPER_ADMIN)
    .maybeSingle();

  if (roleError || !superAdminRole) {
    throw new Error(
      "Super Admin role is unavailable.",
    );
  }

  const {
    data: assignments,
    error: assignmentError,
  } = await adminClient
    .from("user_roles")
    .select("user_id")
    .eq(
      "role_id",
      superAdminRole.id,
    );

  if (assignmentError) {
    throw new Error(
      `Unable to load Super Admin assignments: ${assignmentError.message}`,
    );
  }

  const assignedUserIds =
    Array.from(
      new Set(
        (assignments ?? [])
          .map((row) =>
            String(
              row.user_id ?? "",
            ),
          )
          .filter(Boolean),
      ),
    );

  if (
    assignedUserIds.length === 0
  ) {
    return 0;
  }

  const {
    data: registryRows,
    error: registryError,
  } = await adminClient
    .from("admin_users")
    .select("id")
    .in(
      "role",
      [
        ROLES.SUPER_ADMIN,
        ROLES.ADMIN,
      ],
    )
    .in(
      "id",
      assignedUserIds,
    );

  if (registryError) {
    throw new Error(
      `Unable to verify Super Admin registry: ${registryError.message}`,
    );
  }

  const registryUserIds =
    (registryRows ?? []).map(
      (row) => row.id,
    );

  if (
    registryUserIds.length === 0
  ) {
    return 0;
  }

  const {
    count,
    error: profileError,
  } = await adminClient
    .from("profiles")
    .select("user_id", {
      count: "exact",
      head: true,
    })
    .eq(
      "account_type",
      "admin",
    )
    .in(
      "user_id",
      registryUserIds,
    );

  if (profileError) {
    throw new Error(
      `Unable to verify Super Admin profiles: ${profileError.message}`,
    );
  }

  return count ?? 0;
}

function revalidateAdminAccessPaths() {
  revalidatePath("/admin/admins");
  revalidatePath("/admin/audit-log");
}

function getPendingAdminInviteState(
  user:
    | {
        last_sign_in_at?: string | null;
        user_metadata?: Record<
          string,
          unknown
        > | null;
      }
    | null
    | undefined,
) {
  const invitedAt =
    typeof user?.user_metadata
      ?.admin_invited_at ===
    "string"
      ? user.user_metadata
          .admin_invited_at
      : null;

  return {
    invitedAt,
    pending:
      Boolean(invitedAt) &&
      !user?.last_sign_in_at,
  };
}

async function hasConsistentAdminAssignment(
  userId: string,
  registryRole: string,
) {
  const assignments =
    await getAdminRoleAssignments(
      userId,
    );

  if (
    assignments.length !== 1
  ) {
    return false;
  }

  const assignedRole =
    extractRoleKey(
      assignments[0],
    );

  return (
    assignedRole ===
      registryRole &&
    isAssignableAdminRole(
      assignedRole,
    )
  );
}

type AdminAuditOutcome =
  | "blocked"
  | "failed"
  | "noop";

async function recordAdminAccessOutcome({
  actorId,
  actorEmail,
  action,
  outcome,
  targetId,
  reason,
  metadata = {},
}: {
  actorId: string;
  actorEmail?: string | null;
  action: string;
  outcome: AdminAuditOutcome;
  targetId: string;
  reason: string;
  metadata?: Record<string, unknown>;
}) {
  const eventType =
    outcome === "blocked"
      ? EVENT_TYPES.admin_access_action_blocked
      : outcome === "failed"
        ? EVENT_TYPES.admin_access_action_failed
        : EVENT_TYPES.admin_access_action_noop;

  try {
    await createAuditEvent({
      type: eventType,
      target: EVENT_TARGETS.ADMIN,
      targetId,
      actorId,
      metadata: {
        action,
        outcome,
        reason,
        actor_email:
          actorEmail ?? null,
        ...metadata,
      },
    });
  } catch (auditError) {
    console.error(
      "[recordAdminAccessOutcome]",
      auditError,
    );
  }
}

export async function inviteAdminAction(
  formData: FormData,
) {
  const actor =
    await requirePermission(
      PERMISSIONS.ADMINS_MANAGE,
    );

  const locale =
    getLocale(formData);

  let email: string;

  try {
    email =
      getInviteEmail(formData);
  } catch {
    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "invite_admin",
      outcome: "blocked",
      targetId: "invalid-input",
      reason: "invalid_email_input",
    });

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "invalid_input",
      }),
    );
  }

  let inviteRateLimit;

  try {
    inviteRateLimit =
      await consumeServerRateLimit({
        namespace:
          "admin_invite_create",
        identifier:
          actor.id,
        limit: 10,
        windowSeconds:
          60 * 60,
      });
  } catch (rateLimitError) {
    console.error(
      "[inviteAdminAction rate limit]",
      rateLimitError,
    );

    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "invite_admin",
      outcome: "failed",
      targetId: email,
      reason:
        "invite_rate_limit_unavailable",
    });

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "invite_create_failed",
      }),
    );
  }

  if (!inviteRateLimit.allowed) {
    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "invite_admin",
      outcome: "blocked",
      targetId: email,
      reason:
        "invite_create_rate_limited",
      metadata: {
        retry_after_seconds:
          inviteRateLimit.retryAfterSeconds,
      },
    });

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "invite_create_rate_limited",
      }),
    );
  }

  const adminClient =
    createAdminClient();

  const {
    data: existingAdmin,
    error: existingAdminError,
  } = await adminClient
    .from("admin_users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingAdminError) {
    console.error(
      "[inviteAdminAction registry lookup]",
      existingAdminError,
    );

    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "invite_admin",
      outcome: "failed",
      targetId: email,
      reason: "registry_lookup_failed",
    });

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "invite_lookup_failed",
      }),
    );
  }

  if (existingAdmin) {
    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "invite_admin",
      outcome: "blocked",
      targetId: existingAdmin.id,
      reason: "admin_already_exists",
      metadata: {
        target_email: email,
      },
    });

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "admin_exists",
      }),
    );
  }

  const {
    data: existingAccountRows,
    error: existingAccountError,
  } = await adminClient.rpc(
    "lookup_auth_email_provider",
    {
      p_email: email,
    },
  );

  if (existingAccountError) {
    console.error(
      "[inviteAdminAction auth lookup]",
      existingAccountError,
    );

    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "invite_admin",
      outcome: "failed",
      targetId: email,
      reason: "auth_lookup_failed",
    });

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "invite_lookup_failed",
      }),
    );
  }

  const existingAccount =
    Array.isArray(
      existingAccountRows,
    )
      ? existingAccountRows[0]
      : existingAccountRows;

  if (
    existingAccount?.account_exists
  ) {
    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "invite_admin",
      outcome: "blocked",
      targetId: email,
      reason: "email_in_use",
    });

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "email_in_use",
      }),
    );
  }

  const {
    data: adminRole,
    error: roleError,
  } = await adminClient
    .from("roles")
    .select("id, key")
    .eq("key", ROLES.ADMIN)
    .maybeSingle();

  if (roleError || !adminRole) {
    console.error(
      "[inviteAdminAction role]",
      roleError,
    );

    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "invite_admin",
      outcome: "failed",
      targetId: email,
      reason: "default_role_unavailable",
    });

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "role_not_found",
      }),
    );
  }

  const now =
    new Date().toISOString();
  const temporaryPassword =
    randomBytes(48).toString(
      "base64url",
    );

  const {
    data: createdUserData,
    error: createUserError,
  } = await adminClient.auth.admin.createUser(
    {
      email,
      password:
        temporaryPassword,
      email_confirm: true,
      user_metadata: {
        account_type: "admin",
        admin_invited_by:
          actor.id,
        admin_invited_at: now,
      },
    },
  );

  const invitedUser =
    createdUserData.user;

  if (
    createUserError ||
    !invitedUser
  ) {
    console.error(
      "[inviteAdminAction create user]",
      createUserError,
    );

    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "invite_admin",
      outcome: "failed",
      targetId: email,
      reason: "auth_user_create_failed",
    });

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "invite_create_failed",
      }),
    );
  }

  const rollbackInvite =
    async (reason: string) => {
      const cleanupResults =
        await Promise.all([
          adminClient
            .from("user_roles")
            .delete()
            .eq(
              "user_id",
              invitedUser.id,
            ),
          adminClient
            .from("admin_users")
            .delete()
            .eq(
              "id",
              invitedUser.id,
            ),
          adminClient
            .from("profiles")
            .delete()
            .eq(
              "user_id",
              invitedUser.id,
            ),
        ]);

      for (const cleanupResult of cleanupResults) {
        if (cleanupResult.error) {
          console.error(
            `[inviteAdminAction rollback data ${reason}]`,
            cleanupResult.error,
          );
        }
      }

      const { error: rollbackError } =
        await adminClient.auth.admin.deleteUser(
          invitedUser.id,
        );

      if (rollbackError) {
        console.error(
          `[inviteAdminAction rollback auth ${reason}]`,
          rollbackError,
        );
      }
    };

  const { error: profileError } =
    await adminClient
      .from("profiles")
      .insert({
        user_id: invitedUser.id,
        account_type: "admin",
        display_name: email,
        status: "active",
        onboarding_status:
          "completed",
        onboarding_step:
          "dashboard",
        approval_status:
          "approved",
      });

  if (profileError) {
    console.error(
      "[inviteAdminAction profile]",
      profileError,
    );

    await rollbackInvite(
      "profile",
    );

    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "invite_admin",
      outcome: "failed",
      targetId: invitedUser.id,
      reason: "profile_create_failed",
      metadata: {
        target_email: email,
      },
    });

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "invite_create_failed",
      }),
    );
  }

  const { error: registryError } =
    await adminClient
      .from("admin_users")
      .insert({
        id: invitedUser.id,
        email,
        role: ROLES.ADMIN,
        created_at: now,
      });

  if (registryError) {
    console.error(
      "[inviteAdminAction registry]",
      registryError,
    );

    await rollbackInvite(
      "registry",
    );

    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "invite_admin",
      outcome: "failed",
      targetId: invitedUser.id,
      reason: "registry_create_failed",
      metadata: {
        target_email: email,
      },
    });

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "invite_create_failed",
      }),
    );
  }

  const { error: roleAssignmentError } =
    await adminClient
      .from("user_roles")
      .insert({
        user_id: invitedUser.id,
        role_id: adminRole.id,
      });

  if (roleAssignmentError) {
    console.error(
      "[inviteAdminAction role assignment]",
      roleAssignmentError,
    );

    await rollbackInvite(
      "role_assignment",
    );

    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "invite_admin",
      outcome: "failed",
      targetId: invitedUser.id,
      reason: "role_assignment_failed",
      metadata: {
        target_email: email,
      },
    });

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "invite_create_failed",
      }),
    );
  }

  const siteUrl = (
    process.env
      .NEXT_PUBLIC_SITE_URL ||
    "https://mlamh.net"
  ).replace(/\/$/, "");

  const {
    error: recoveryEmailError,
  } = await adminClient.auth.resetPasswordForEmail(
    email,
    {
      redirectTo:
        `${siteUrl}/${locale}/reset-password?mode=admin-invite`,
    },
  );

  if (recoveryEmailError) {
    console.error(
      "[inviteAdminAction recovery email]",
      recoveryEmailError,
    );

    await rollbackInvite(
      "recovery_email",
    );

    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "invite_admin",
      outcome: "failed",
      targetId: invitedUser.id,
      reason: "activation_email_failed",
      metadata: {
        target_email: email,
      },
    });

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "invite_email_failed",
      }),
    );
  }

  try {
      await createAuditEvent({
        type:
          EVENT_TYPES.admin_invited,
        target:
          EVENT_TARGETS.ADMIN,
        targetId: invitedUser.id,
        actorId: actor.id,
        metadata: {
          action: "invite_admin",
          outcome: "success",
          role: ROLES.ADMIN,
          invited_email: email,
          actor_email:
            actor.email ?? null,
        },
      });
  } catch (auditError) {
    console.error(
      "[inviteAdminAction audit]",
      auditError,
    );
  }

  revalidateAdminAccessPaths();

  redirect(
    accessCenterUrl(locale, {
      access_invited: "1",
    }),
  );
}

export async function resendAdminInviteAction(
  formData: FormData,
) {
  const actor =
    await requirePermission(
      PERMISSIONS.ADMINS_MANAGE,
    );

  const locale =
    getLocale(formData);

  let targetUserId: string;

  try {
    targetUserId =
      getTargetUserId(formData);
  } catch {
    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "resend_admin_invite",
      outcome: "blocked",
      targetId: "invalid-input",
      reason: "invalid_admin_id",
    });

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "invalid_input",
      }),
    );
  }

  const adminClient =
    createAdminClient();

  const {
    data: targetAdmin,
    error: targetAdminError,
  } = await adminClient
    .from("admin_users")
    .select("id, email, role")
    .eq("id", targetUserId)
    .maybeSingle();

  if (
    targetAdminError ||
    !targetAdmin ||
    !isAssignableAdminRole(
      targetAdmin.role,
    )
  ) {
    console.error(
      "[resendAdminInviteAction target]",
      targetAdminError,
    );

    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "resend_admin_invite",
      outcome: "failed",
      targetId: targetUserId,
      reason: "target_not_available",
    });

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "admin_not_found",
      }),
    );
  }

  let hasActiveAssignment = false;

  try {
    hasActiveAssignment =
      await hasConsistentAdminAssignment(
        targetUserId,
        targetAdmin.role,
      );
  } catch (assignmentError) {
    console.error(
      "[resendAdminInviteAction assignment]",
      assignmentError,
    );

    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "resend_admin_invite",
      outcome: "failed",
      targetId: targetUserId,
      reason: "role_assignment_lookup_failed",
      metadata: {
        target_email:
          targetAdmin.email,
      },
    });

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "invite_resend_failed",
      }),
    );
  }

  if (!hasActiveAssignment) {
    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "resend_admin_invite",
      outcome: "blocked",
      targetId: targetUserId,
      reason: "invite_access_inconsistent",
      metadata: {
        target_email:
          targetAdmin.email,
      },
    });

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "invite_access_inconsistent",
      }),
    );
  }

  const {
    data: authUserData,
    error: authUserError,
  } =
    await adminClient.auth.admin.getUserById(
      targetUserId,
    );

  const authUser =
    authUserData.user;
  const inviteState =
    getPendingAdminInviteState(
      authUser,
    );

  if (
    authUserError ||
    !authUser ||
    !inviteState.pending
  ) {
    console.error(
      "[resendAdminInviteAction auth state]",
      authUserError,
    );

    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "resend_admin_invite",
      outcome: "blocked",
      targetId: targetUserId,
      reason: "invite_not_pending",
      metadata: {
        target_email:
          targetAdmin.email,
      },
    });

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "invite_not_pending",
      }),
    );
  }

  let resendRateLimit;

  try {
    resendRateLimit =
      await consumeServerRateLimit({
        namespace:
          "admin_invite_resend",
        identifier:
          `${actor.id}:${targetUserId}`,
        limit: 3,
        windowSeconds:
          30 * 60,
      });
  } catch (rateLimitError) {
    console.error(
      "[resendAdminInviteAction rate limit]",
      rateLimitError,
    );

    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "resend_admin_invite",
      outcome: "failed",
      targetId: targetUserId,
      reason:
        "invite_resend_rate_limit_unavailable",
      metadata: {
        target_email:
          targetAdmin.email,
      },
    });

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "invite_resend_failed",
      }),
    );
  }

  if (!resendRateLimit.allowed) {
    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "resend_admin_invite",
      outcome: "blocked",
      targetId: targetUserId,
      reason:
        "invite_resend_rate_limited",
      metadata: {
        target_email:
          targetAdmin.email,
        retry_after_seconds:
          resendRateLimit.retryAfterSeconds,
      },
    });

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "invite_rate_limited",
      }),
    );
  }

  const siteUrl = (
    process.env
      .NEXT_PUBLIC_SITE_URL ||
    "https://mlamh.net"
  ).replace(/\/$/, "");

  const {
    error: resendError,
  } = await adminClient.auth.resetPasswordForEmail(
    targetAdmin.email,
    {
      redirectTo:
        `${siteUrl}/${locale}/reset-password?mode=admin-invite`,
    },
  );

  if (resendError) {
    console.error(
      "[resendAdminInviteAction email]",
      resendError,
    );

    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "resend_admin_invite",
      outcome: "failed",
      targetId: targetUserId,
      reason: "activation_email_failed",
      metadata: {
        target_email:
          targetAdmin.email,
      },
    });

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "invite_resend_failed",
      }),
    );
  }

  try {
    await createAuditEvent({
      type:
        EVENT_TYPES.admin_invite_resent,
      target:
        EVENT_TARGETS.ADMIN,
      targetId: targetUserId,
      actorId: actor.id,
      metadata: {
        action:
          "resend_admin_invite",
        outcome: "success",
        invited_email:
          targetAdmin.email,
        actor_email:
          actor.email ?? null,
      },
    });
  } catch (auditError) {
    console.error(
      "[resendAdminInviteAction audit]",
      auditError,
    );
  }

  revalidateAdminAccessPaths();

  redirect(
    accessCenterUrl(locale, {
      access_resent: "1",
    }),
  );
}

export async function cancelPendingAdminInviteAction(
  formData: FormData,
) {
  const actor =
    await requirePermission(
      PERMISSIONS.ADMINS_MANAGE,
    );

  const locale =
    getLocale(formData);

  let targetUserId: string;

  try {
    targetUserId =
      getTargetUserId(formData);
  } catch {
    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "cancel_admin_invite",
      outcome: "blocked",
      targetId: "invalid-input",
      reason: "invalid_admin_id",
    });

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "invalid_input",
      }),
    );
  }

  const adminClient =
    createAdminClient();

  const {
    data: targetAdmin,
    error: targetAdminError,
  } = await adminClient
    .from("admin_users")
    .select("id, email, role")
    .eq("id", targetUserId)
    .maybeSingle();

  if (
    targetAdminError ||
    !targetAdmin ||
    !isAssignableAdminRole(
      targetAdmin.role,
    )
  ) {
    console.error(
      "[cancelPendingAdminInviteAction target]",
      targetAdminError,
    );

    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "cancel_admin_invite",
      outcome: "failed",
      targetId: targetUserId,
      reason: "target_not_available",
    });

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "admin_not_found",
      }),
    );
  }

  let hasActiveAssignment = false;

  try {
    hasActiveAssignment =
      await hasConsistentAdminAssignment(
        targetUserId,
        targetAdmin.role,
      );
  } catch (assignmentError) {
    console.error(
      "[cancelPendingAdminInviteAction assignment]",
      assignmentError,
    );

    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "cancel_admin_invite",
      outcome: "failed",
      targetId: targetUserId,
      reason: "role_assignment_lookup_failed",
      metadata: {
        target_email:
          targetAdmin.email,
      },
    });

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "invite_cancel_failed",
      }),
    );
  }

  if (!hasActiveAssignment) {
    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "cancel_admin_invite",
      outcome: "blocked",
      targetId: targetUserId,
      reason: "invite_access_inconsistent",
      metadata: {
        target_email:
          targetAdmin.email,
      },
    });

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "invite_access_inconsistent",
      }),
    );
  }

  const {
    data: authUserData,
    error: authUserError,
  } =
    await adminClient.auth.admin.getUserById(
      targetUserId,
    );

  const authUser =
    authUserData.user;
  const inviteState =
    getPendingAdminInviteState(
      authUser,
    );

  if (
    authUserError ||
    !authUser ||
    !inviteState.pending
  ) {
    console.error(
      "[cancelPendingAdminInviteAction auth state]",
      authUserError,
    );

    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "cancel_admin_invite",
      outcome: "blocked",
      targetId: targetUserId,
      reason: "invite_not_pending",
      metadata: {
        target_email:
          targetAdmin.email,
      },
    });

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "invite_not_pending",
      }),
    );
  }

  // Remove the Auth identity first. admin_users and user_roles cascade from auth.users.
  // The profile row is cleaned explicitly because it is not guaranteed to cascade.
  const {
    error: deleteAuthError,
  } =
    await adminClient.auth.admin.deleteUser(
      targetUserId,
    );

  if (deleteAuthError) {
    console.error(
      "[cancelPendingAdminInviteAction auth delete]",
      deleteAuthError,
    );

    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "cancel_admin_invite",
      outcome: "failed",
      targetId: targetUserId,
      reason: "auth_delete_failed",
      metadata: {
        target_email:
          targetAdmin.email,
      },
    });

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "invite_cancel_failed",
      }),
    );
  }

  const { error: profileCleanupError } =
    await adminClient
      .from("profiles")
      .delete()
      .eq(
        "user_id",
        targetUserId,
      );

  if (profileCleanupError) {
    console.error(
      "[cancelPendingAdminInviteAction profile cleanup]",
      profileCleanupError,
    );

    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "cancel_admin_invite",
      outcome: "failed",
      targetId: targetUserId,
      reason: "profile_cleanup_failed_after_auth_delete",
      metadata: {
        target_email:
          targetAdmin.email,
      },
    });
  }

  try {
    await createAuditEvent({
      type:
        EVENT_TYPES.admin_invite_cancelled,
      target:
        EVENT_TARGETS.ADMIN,
      targetId: targetUserId,
      actorId: actor.id,
      metadata: {
        action:
          "cancel_admin_invite",
        outcome: "success",
        invited_email:
          targetAdmin.email,
        actor_email:
          actor.email ?? null,
      },
    });
  } catch (auditError) {
    console.error(
      "[cancelPendingAdminInviteAction audit]",
      auditError,
    );
  }

  revalidateAdminAccessPaths();

  redirect(
    accessCenterUrl(locale, {
      access_cancelled: "1",
    }),
  );
}

export async function updateAdminRoleAction(
  formData: FormData,
) {
  const actor =
    await requirePermission(
      PERMISSIONS.ADMINS_MANAGE,
    );

  const locale =
    getLocale(formData);

  const canManageRoles =
    await userHasPermission(
      actor.id,
      PERMISSIONS.ROLES_MANAGE,
    );

  if (!canManageRoles) {
    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "update_admin_role",
      outcome: "blocked",
      targetId:
        "permission-denied",
      reason:
        "roles_manage_permission_required",
    });

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "role_permission_denied",
      }),
    );
  }

  let targetUserId: string;

  try {
    targetUserId =
      getTargetUserId(formData);
  } catch {
    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "update_admin_role",
      outcome: "blocked",
      targetId: "invalid-input",
      reason: "invalid_admin_id",
    });

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "invalid_input",
      }),
    );
  }

  let roleKey: RoleKey;

  try {
    roleKey =
      getRoleKey(formData);
  } catch {
    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "update_admin_role",
      outcome: "blocked",
      targetId: targetUserId,
      reason: "invalid_role_input",
    });

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "invalid_input",
      }),
    );
  }

  const adminClient =
    createAdminClient();

  const [
    { data: targetAdmin, error: targetAdminError },
    { data: targetProfile, error: targetProfileError },
    { data: selectedRole, error: selectedRoleError },
  ] = await Promise.all([
    adminClient
      .from("admin_users")
      .select("id, email, role")
      .eq("id", targetUserId)
      .maybeSingle(),
    adminClient
      .from("profiles")
      .select("account_type")
      .eq("user_id", targetUserId)
      .maybeSingle(),
    adminClient
      .from("roles")
      .select("id, key")
      .eq("key", roleKey)
      .maybeSingle(),
  ]);

  if (
    targetAdminError ||
    targetProfileError ||
    !targetAdmin ||
    !targetProfile ||
    targetProfile.account_type !==
      "admin"
  ) {
    console.error(
      "[updateAdminRoleAction target]",
      targetAdminError ??
        targetProfileError,
    );

    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "update_admin_role",
      outcome: "failed",
      targetId: targetUserId,
      reason: "target_not_available",
      metadata: {
        requested_role: roleKey,
      },
    });

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "admin_not_found",
      }),
    );
  }

  if (
    selectedRoleError ||
    !selectedRole
  ) {
    console.error(
      "[updateAdminRoleAction role]",
      selectedRoleError,
    );

    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "update_admin_role",
      outcome: "failed",
      targetId: targetUserId,
      reason: "selected_role_unavailable",
      metadata: {
        requested_role: roleKey,
        target_email:
          targetAdmin.email,
      },
    });

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "role_not_found",
      }),
    );
  }

  const {
    data: targetAuthData,
    error: targetAuthError,
  } =
    await adminClient.auth.admin.getUserById(
      targetUserId,
    );

  if (
    targetAuthError ||
    !targetAuthData.user
  ) {
    console.error(
      "[updateAdminRoleAction auth]",
      targetAuthError,
    );

    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "update_admin_role",
      outcome: "failed",
      targetId: targetUserId,
      reason: "target_auth_state_unavailable",
      metadata: {
        requested_role: roleKey,
        target_email:
          targetAdmin.email,
      },
    });

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "admin_not_found",
      }),
    );
  }

  const targetInviteState =
    getPendingAdminInviteState(
      targetAuthData.user,
    );

  if (
    targetInviteState.pending
  ) {
    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "update_admin_role",
      outcome: "blocked",
      targetId: targetUserId,
      reason: "invite_pending_role_change",
      metadata: {
        target_email:
          targetAdmin.email,
        requested_role: roleKey,
        invited_at:
          targetInviteState.invitedAt,
      },
    });

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "invite_pending_role_change",
      }),
    );
  }

  let currentAssignments: RoleAssignmentRow[];

  try {
    currentAssignments =
      await getAdminRoleAssignments(
        targetUserId,
      );
  } catch (assignmentError) {
    console.error(
      "[updateAdminRoleAction assignments]",
      assignmentError,
    );

    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "update_admin_role",
      outcome: "failed",
      targetId: targetUserId,
      reason:
        "role_assignment_lookup_failed",
      metadata: {
        requested_role: roleKey,
        target_email:
          targetAdmin.email,
      },
    });

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "role_update_failed",
      }),
    );
  }

  const previousRoleIds =
    currentAssignments.map(
      (assignment) =>
        assignment.role_id,
    );

  const previousRoleKeys =
    currentAssignments
      .map(extractRoleKey)
      .filter(
        (
          key,
        ): key is string =>
          Boolean(key),
      );

  const currentRoleKey =
    previousRoleKeys.length === 1
      ? previousRoleKeys[0]
      : null;

  const sensitiveRoleChange =
    crossesSuperAdminBoundary(
      currentRoleKey,
      roleKey,
    );

  if (
    sensitiveRoleChange &&
    formData.get(
      "confirm_sensitive_role",
    ) !== "1"
  ) {
    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "update_admin_role",
      outcome: "blocked",
      targetId: targetUserId,
      reason:
        "sensitive_role_confirmation_required",
      metadata: {
        target_email:
          targetAdmin.email,
        previous_roles:
          previousRoleKeys,
        requested_role:
          roleKey,
      },
    });

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "sensitive_role_confirmation_required",
      }),
    );
  }

  if (
    actor.id === targetUserId &&
    currentRoleKey !== roleKey
  ) {
    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "update_admin_role",
      outcome: "blocked",
      targetId: targetUserId,
      reason: "self_role_change",
      metadata: {
        target_email:
          targetAdmin.email,
        previous_roles:
          previousRoleKeys,
        requested_role: roleKey,
      },
    });

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "self_role_change",
      }),
    );
  }

  if (
    previousRoleKeys.includes(
      ROLES.SUPER_ADMIN,
    ) &&
    roleKey !==
      ROLES.SUPER_ADMIN
  ) {
    let mutationGuard;

    try {
      mutationGuard =
        await consumeServerRateLimit({
          namespace:
            "super_admin_mutation",
          identifier:
            "global",
          limit: 1,
          windowSeconds: 10,
        });
    } catch (guardError) {
      console.error(
        "[updateAdminRoleAction super admin guard]",
        guardError,
      );

      await recordAdminAccessOutcome({
        actorId: actor.id,
        actorEmail: actor.email,
        action: "update_admin_role",
        outcome: "failed",
        targetId: targetUserId,
        reason:
          "super_admin_mutation_guard_unavailable",
        metadata: {
          target_email:
            targetAdmin.email,
          previous_roles:
            previousRoleKeys,
          requested_role:
            roleKey,
        },
      });

      redirect(
        accessCenterUrl(locale, {
          access_error:
            "super_admin_change_busy",
        }),
      );
    }

    if (!mutationGuard.allowed) {
      await recordAdminAccessOutcome({
        actorId: actor.id,
        actorEmail: actor.email,
        action: "update_admin_role",
        outcome: "blocked",
        targetId: targetUserId,
        reason:
          "super_admin_mutation_guard_busy",
        metadata: {
          target_email:
            targetAdmin.email,
          previous_roles:
            previousRoleKeys,
          requested_role:
            roleKey,
          retry_after_seconds:
            mutationGuard.retryAfterSeconds,
        },
      });

      redirect(
        accessCenterUrl(locale, {
          access_error:
            "super_admin_change_busy",
        }),
      );
    }

    let superAdminCount: number;

    try {
      superAdminCount =
        await countSuperAdmins();
    } catch (countError) {
      console.error(
        "[updateAdminRoleAction super admin count]",
        countError,
      );

      await recordAdminAccessOutcome({
        actorId: actor.id,
        actorEmail: actor.email,
        action: "update_admin_role",
        outcome: "failed",
        targetId: targetUserId,
        reason:
          "super_admin_count_failed",
        metadata: {
          target_email:
            targetAdmin.email,
          previous_roles:
            previousRoleKeys,
          requested_role:
            roleKey,
        },
      });

      redirect(
        accessCenterUrl(locale, {
          access_error:
            "role_update_failed",
        }),
      );
    }

    if (superAdminCount <= 1) {
      await recordAdminAccessOutcome({
        actorId: actor.id,
        actorEmail: actor.email,
        action: "update_admin_role",
        outcome: "blocked",
        targetId: targetUserId,
        reason: "last_super_admin",
        metadata: {
          target_email:
            targetAdmin.email,
          previous_roles:
            previousRoleKeys,
          requested_role: roleKey,
        },
      });

      redirect(
        accessCenterUrl(locale, {
          access_error:
            "last_super_admin",
        }),
      );
    }
  }

  const alreadyAligned =
    previousRoleKeys.length === 1 &&
    previousRoleKeys[0] ===
      roleKey &&
    targetAdmin.role === roleKey;

  if (alreadyAligned) {
    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "update_admin_role",
      outcome: "noop",
      targetId: targetUserId,
      reason: "already_aligned",
      metadata: {
        target_email:
          targetAdmin.email,
        role: roleKey,
      },
    });

    redirect(
      accessCenterUrl(locale, {
        access_saved: "1",
      }),
    );
  }

  const registryOnlySync =
    previousRoleKeys.length === 1 &&
    previousRoleKeys[0] ===
      roleKey &&
    targetAdmin.role !== roleKey;

  if (registryOnlySync) {
    const { error: registrySyncError } =
      await adminClient
        .from("admin_users")
        .update({
          role: roleKey,
        })
        .eq(
          "id",
          targetUserId,
        );

    if (registrySyncError) {
      console.error(
        "[updateAdminRoleAction registry-only sync]",
        registrySyncError,
      );

      await recordAdminAccessOutcome({
        actorId: actor.id,
        actorEmail: actor.email,
        action: "update_admin_role",
        outcome: "failed",
        targetId: targetUserId,
        reason:
          "registry_sync_failed",
        metadata: {
          target_email:
            targetAdmin.email,
          previous_registry_role:
            targetAdmin.role,
          effective_role:
            roleKey,
        },
      });

      redirect(
        accessCenterUrl(locale, {
          access_error:
            "role_update_failed",
        }),
      );
    }

    try {
      await createAuditEvent({
        type:
          EVENT_TYPES.admin_role_changed,
        target:
          EVENT_TARGETS.ADMIN,
        targetId: targetUserId,
        actorId: actor.id,
        metadata: {
          action:
            "sync_admin_role_registry",
          outcome: "success",
          target_email:
            targetAdmin.email,
          previous_registry_role:
            targetAdmin.role,
          effective_role:
            roleKey,
          registry_only_sync:
            true,
          actor_email:
            actor.email ?? null,
        },
      });
    } catch (auditError) {
      console.error(
        "[updateAdminRoleAction registry-only audit]",
        auditError,
      );
    }

    revalidateAdminAccessPaths();

    redirect(
      accessCenterUrl(locale, {
        access_synced: "1",
      }),
    );
  }

  const { error: deleteError } =
    await adminClient
      .from("user_roles")
      .delete()
      .eq(
        "user_id",
        targetUserId,
      );

  if (deleteError) {
    console.error(
      "[updateAdminRoleAction delete]",
      deleteError,
    );

    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "update_admin_role",
      outcome: "failed",
      targetId: targetUserId,
      reason: "existing_role_delete_failed",
      metadata: {
        target_email:
          targetAdmin.email,
        previous_roles:
          previousRoleKeys,
        requested_role: roleKey,
      },
    });

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "role_update_failed",
      }),
    );
  }

  const { error: insertError } =
    await adminClient
      .from("user_roles")
      .insert({
        user_id: targetUserId,
        role_id: selectedRole.id,
      });

  if (insertError) {
    console.error(
      "[updateAdminRoleAction insert]",
      insertError,
    );

    let rollbackSucceeded = true;

    if (
      previousRoleIds.length > 0
    ) {
      const { error: rollbackError } =
        await adminClient
          .from("user_roles")
          .insert(
            previousRoleIds.map(
              (roleId) => ({
                user_id:
                  targetUserId,
                role_id: roleId,
              }),
            ),
          );

      if (rollbackError) {
        rollbackSucceeded = false;
        console.error(
          "[updateAdminRoleAction rollback roles]",
          rollbackError,
        );
      }
    }

    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "update_admin_role",
      outcome: "failed",
      targetId: targetUserId,
      reason: "new_role_insert_failed",
      metadata: {
        target_email:
          targetAdmin.email,
        previous_roles:
          previousRoleKeys,
        requested_role: roleKey,
        rollback_succeeded:
          rollbackSucceeded,
      },
    });

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "role_update_failed",
      }),
    );
  }

  const { error: registryError } =
    await adminClient
      .from("admin_users")
      .update({
        role: roleKey,
      })
      .eq("id", targetUserId);

  if (registryError) {
    console.error(
      "[updateAdminRoleAction registry]",
      registryError,
    );

    let rollbackSucceeded = true;

    const { error: cleanupError } =
      await adminClient
        .from("user_roles")
        .delete()
        .eq(
          "user_id",
          targetUserId,
        );

    if (cleanupError) {
      rollbackSucceeded = false;
      console.error(
        "[updateAdminRoleAction cleanup]",
        cleanupError,
      );
    }

    if (
      previousRoleIds.length > 0
    ) {
      const { error: rollbackError } =
        await adminClient
          .from("user_roles")
          .insert(
            previousRoleIds.map(
              (roleId) => ({
                user_id:
                  targetUserId,
                role_id: roleId,
              }),
            ),
          );

      if (rollbackError) {
        rollbackSucceeded = false;
        console.error(
          "[updateAdminRoleAction rollback registry]",
          rollbackError,
        );
      }
    }

    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "update_admin_role",
      outcome: "failed",
      targetId: targetUserId,
      reason: "registry_update_failed",
      metadata: {
        target_email:
          targetAdmin.email,
        previous_roles:
          previousRoleKeys,
        requested_role: roleKey,
        rollback_succeeded:
          rollbackSucceeded,
      },
    });

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "role_update_failed",
      }),
    );
  }

  try {
      await createAuditEvent({
        type:
          EVENT_TYPES.admin_role_changed,
        target:
          EVENT_TARGETS.ADMIN,
        targetId: targetUserId,
        actorId: actor.id,
        metadata: {
          action:
            "update_admin_role",
          outcome: "success",
          target_email:
            targetAdmin.email,
          previous_roles:
            previousRoleKeys,
          new_role: roleKey,
          actor_email:
            actor.email ?? null,
        },
      });
  } catch (auditError) {
    console.error(
      "[updateAdminRoleAction audit]",
      auditError,
    );
  }

  revalidateAdminAccessPaths();

  redirect(
    accessCenterUrl(locale, {
      access_saved: "1",
    }),
  );
}

export async function revokeAdminAccessAction(
  formData: FormData,
) {
  const actor =
    await requirePermission(
      PERMISSIONS.ADMINS_MANAGE,
    );

  const locale =
    getLocale(formData);

  let targetUserId: string;

  try {
    targetUserId =
      getTargetUserId(formData);
  } catch {
    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "revoke_admin_access",
      outcome: "blocked",
      targetId: "invalid-input",
      reason: "invalid_admin_id",
    });

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "invalid_input",
      }),
    );
  }

  if (actor.id === targetUserId) {
    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "revoke_admin_access",
      outcome: "blocked",
      targetId: targetUserId,
      reason: "self_revoke",
    });

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "self_revoke",
      }),
    );
  }

  const adminClient =
    createAdminClient();

  const { data: targetAdmin, error } =
    await adminClient
      .from("admin_users")
      .select("id, email, role")
      .eq("id", targetUserId)
      .maybeSingle();

  if (error || !targetAdmin) {
    console.error(
      "[revokeAdminAccessAction target]",
      error,
    );

    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "revoke_admin_access",
      outcome: "failed",
      targetId: targetUserId,
      reason: "target_not_available",
    });

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "admin_not_found",
      }),
    );
  }

  let currentAssignments: RoleAssignmentRow[];

  try {
    currentAssignments =
      await getAdminRoleAssignments(
        targetUserId,
      );
  } catch (assignmentError) {
    console.error(
      "[revokeAdminAccessAction assignments]",
      assignmentError,
    );

    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "revoke_admin_access",
      outcome: "failed",
      targetId: targetUserId,
      reason:
        "role_assignment_lookup_failed",
      metadata: {
        target_email:
          targetAdmin.email,
      },
    });

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "revoke_failed",
      }),
    );
  }

  const previousRoleIds =
    currentAssignments.map(
      (assignment) =>
        assignment.role_id,
    );

  const previousRoleKeys =
    currentAssignments
      .map(extractRoleKey)
      .filter(
        (
          key,
        ): key is string =>
          Boolean(key),
      );

  if (
    previousRoleKeys.includes(
      ROLES.SUPER_ADMIN,
    )
  ) {
    let mutationGuard;

    try {
      mutationGuard =
        await consumeServerRateLimit({
          namespace:
            "super_admin_mutation",
          identifier:
            "global",
          limit: 1,
          windowSeconds: 10,
        });
    } catch (guardError) {
      console.error(
        "[revokeAdminAccessAction super admin guard]",
        guardError,
      );

      await recordAdminAccessOutcome({
        actorId: actor.id,
        actorEmail: actor.email,
        action: "revoke_admin_access",
        outcome: "failed",
        targetId: targetUserId,
        reason:
          "super_admin_mutation_guard_unavailable",
        metadata: {
          target_email:
            targetAdmin.email,
          previous_roles:
            previousRoleKeys,
        },
      });

      redirect(
        accessCenterUrl(locale, {
          access_error:
            "super_admin_change_busy",
        }),
      );
    }

    if (!mutationGuard.allowed) {
      await recordAdminAccessOutcome({
        actorId: actor.id,
        actorEmail: actor.email,
        action: "revoke_admin_access",
        outcome: "blocked",
        targetId: targetUserId,
        reason:
          "super_admin_mutation_guard_busy",
        metadata: {
          target_email:
            targetAdmin.email,
          previous_roles:
            previousRoleKeys,
          retry_after_seconds:
            mutationGuard.retryAfterSeconds,
        },
      });

      redirect(
        accessCenterUrl(locale, {
          access_error:
            "super_admin_change_busy",
        }),
      );
    }

    let superAdminCount: number;

    try {
      superAdminCount =
        await countSuperAdmins();
    } catch (countError) {
      console.error(
        "[revokeAdminAccessAction super admin count]",
        countError,
      );

      await recordAdminAccessOutcome({
        actorId: actor.id,
        actorEmail: actor.email,
        action: "revoke_admin_access",
        outcome: "failed",
        targetId: targetUserId,
        reason:
          "super_admin_count_failed",
        metadata: {
          target_email:
            targetAdmin.email,
          previous_roles:
            previousRoleKeys,
        },
      });

      redirect(
        accessCenterUrl(locale, {
          access_error:
            "revoke_failed",
        }),
      );
    }

    if (superAdminCount <= 1) {
      await recordAdminAccessOutcome({
        actorId: actor.id,
        actorEmail: actor.email,
        action: "revoke_admin_access",
        outcome: "blocked",
        targetId: targetUserId,
        reason: "last_super_admin",
        metadata: {
          target_email:
            targetAdmin.email,
          previous_roles:
            previousRoleKeys,
        },
      });

      redirect(
        accessCenterUrl(locale, {
          access_error:
            "last_super_admin",
        }),
      );
    }
  }

  // Active access is granted by user_roles. Remove those assignments first
  // so the account is denied immediately while preserving the registry row
  // as an auditable, restorable admin identity.
  const { error: roleCleanupError } =
    await adminClient
      .from("user_roles")
      .delete()
      .eq(
        "user_id",
        targetUserId,
      );

  if (roleCleanupError) {
    console.error(
      "[revokeAdminAccessAction role cleanup]",
      roleCleanupError,
    );

    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "revoke_admin_access",
      outcome: "failed",
      targetId: targetUserId,
      reason: "role_cleanup_failed",
      metadata: {
        target_email:
          targetAdmin.email,
        previous_roles:
          previousRoleKeys,
      },
    });

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "revoke_failed",
      }),
    );
  }

  const { error: registryError } =
    await adminClient
      .from("admin_users")
      .update({
        role: "revoked",
      })
      .eq("id", targetUserId);

  if (registryError) {
    console.error(
      "[revokeAdminAccessAction registry]",
      registryError,
    );

    let rollbackSucceeded = true;

    if (
      previousRoleIds.length > 0
    ) {
      const { error: rollbackError } =
        await adminClient
          .from("user_roles")
          .insert(
            previousRoleIds.map(
              (roleId) => ({
                user_id:
                  targetUserId,
                role_id: roleId,
              }),
            ),
          );

      if (rollbackError) {
        rollbackSucceeded = false;
        console.error(
          "[revokeAdminAccessAction rollback]",
          rollbackError,
        );
      }
    }

    await recordAdminAccessOutcome({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "revoke_admin_access",
      outcome: "failed",
      targetId: targetUserId,
      reason: "registry_revoke_failed",
      metadata: {
        target_email:
          targetAdmin.email,
        previous_roles:
          previousRoleKeys,
        rollback_succeeded:
          rollbackSucceeded,
      },
    });

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "revoke_failed",
      }),
    );
  }

  try {
      await createAuditEvent({
        type:
          EVENT_TYPES.admin_access_revoked,
        target:
          EVENT_TARGETS.ADMIN,
        targetId: targetUserId,
        actorId: actor.id,
        metadata: {
          action:
            "revoke_admin_access",
          outcome: "success",
          target_email:
            targetAdmin.email,
          previous_roles:
            previousRoleKeys,
          actor_email:
            actor.email ?? null,
        },
      });
  } catch (auditError) {
    console.error(
      "[revokeAdminAccessAction audit]",
      auditError,
    );
  }

  revalidateAdminAccessPaths();

  redirect(
    accessCenterUrl(locale, {
      access_revoked: "1",
    }),
  );
}
