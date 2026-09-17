"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createEvent } from "@/lib/events/create-event";
import { EVENT_TARGETS } from "@/lib/events/event-targets";
import { EVENT_TYPES } from "@/lib/events/event-types";
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

const MANAGEABLE_ROLE_KEYS = new Set<RoleKey>(
  Object.values(ROLES),
);

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getLocale(
  formData: FormData,
): Locale {
  return formData.get("locale") === "en"
    ? "en"
    : "ar";
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
  ) as RoleKey;

  if (!MANAGEABLE_ROLE_KEYS.has(value)) {
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
