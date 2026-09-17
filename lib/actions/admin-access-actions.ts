"use server";

import { randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createEvent } from "@/lib/events/create-event";
import { EVENT_TARGETS } from "@/lib/events/event-targets";
import { EVENT_TYPES } from "@/lib/events/event-types";
import { isAssignableAdminRole } from "@/lib/rbac/admin-access-policy";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { requirePermission } from "@/lib/rbac/guards";
import { ROLES, type RoleKey } from "@/lib/rbac/roles";
import { createAdminClient } from "@/lib/supabase/admin";

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

  const { count, error } =
    await adminClient
      .from("user_roles")
      .select("user_id", {
        count: "exact",
        head: true,
      })
      .eq(
        "role_id",
        superAdminRole.id,
      );

  if (error) {
    throw new Error(
      `Unable to count Super Admin assignments: ${error.message}`,
    );
  }

  return count ?? 0;
}

function revalidateAdminAccessPaths() {
  revalidatePath("/admin/admins");
  revalidatePath("/admin/audit-log");
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
  const email =
    getInviteEmail(formData);
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

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "invite_lookup_failed",
      }),
    );
  }

  if (existingAdmin) {
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

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "invite_email_failed",
      }),
    );
  }

  await createEvent({
    type:
      EVENT_TYPES.admin_invited,
    target:
      EVENT_TARGETS.ADMIN,
    targetId: invitedUser.id,
    actorId: actor.id,
    metadata: {
      role: ROLES.ADMIN,
      invited_email: email,
    },
  });

  revalidateAdminAccessPaths();

  redirect(
    accessCenterUrl(locale, {
      access_invited: "1",
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
  const targetUserId =
    getTargetUserId(formData);
  const roleKey =
    getRoleKey(formData);

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

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "role_not_found",
      }),
    );
  }

  const currentAssignments =
    await getAdminRoleAssignments(
      targetUserId,
    );

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

  if (
    actor.id === targetUserId &&
    currentRoleKey !== roleKey
  ) {
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
    const superAdminCount =
      await countSuperAdmins();

    if (superAdminCount <= 1) {
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
    redirect(
      accessCenterUrl(locale, {
        access_saved: "1",
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
        console.error(
          "[updateAdminRoleAction rollback roles]",
          rollbackError,
        );
      }
    }

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

    const { error: cleanupError } =
      await adminClient
        .from("user_roles")
        .delete()
        .eq(
          "user_id",
          targetUserId,
        );

    if (cleanupError) {
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
        console.error(
          "[updateAdminRoleAction rollback registry]",
          rollbackError,
        );
      }
    }

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "role_update_failed",
      }),
    );
  }

  await createEvent({
    type:
      EVENT_TYPES.admin_role_changed,
    target:
      EVENT_TARGETS.ADMIN,
    targetId: targetUserId,
    actorId: actor.id,
    metadata: {
      previous_roles:
        previousRoleKeys,
      new_role: roleKey,
    },
  });

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
  const targetUserId =
    getTargetUserId(formData);

  if (actor.id === targetUserId) {
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
      .select("id, email")
      .eq("id", targetUserId)
      .maybeSingle();

  if (error || !targetAdmin) {
    console.error(
      "[revokeAdminAccessAction target]",
      error,
    );

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "admin_not_found",
      }),
    );
  }

  const currentAssignments =
    await getAdminRoleAssignments(
      targetUserId,
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
    const superAdminCount =
      await countSuperAdmins();

    if (superAdminCount <= 1) {
      redirect(
        accessCenterUrl(locale, {
          access_error:
            "last_super_admin",
        }),
      );
    }
  }

  // Delete the explicit registry entry first.
  // requireAdminAccess() checks this registry on every admin request,
  // so access is revoked immediately even if later cleanup fails.
  const { error: revokeError } =
    await adminClient
      .from("admin_users")
      .delete()
      .eq("id", targetUserId);

  if (revokeError) {
    console.error(
      "[revokeAdminAccessAction registry]",
      revokeError,
    );

    redirect(
      accessCenterUrl(locale, {
        access_error:
          "revoke_failed",
      }),
    );
  }

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
  }

  await createEvent({
    type:
      EVENT_TYPES.admin_access_revoked,
    target:
      EVENT_TARGETS.ADMIN,
    targetId: targetUserId,
    actorId: actor.id,
    metadata: {
      previous_roles:
        previousRoleKeys,
    },
  });

  revalidateAdminAccessPaths();

  redirect(
    accessCenterUrl(locale, {
      access_revoked: "1",
    }),
  );
}
