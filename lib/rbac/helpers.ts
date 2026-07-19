import { createAdminClient } from "@/lib/supabase/admin";

import type { Permission } from "./permissions";
import type { RoleKey } from "./roles";

export async function getUserRoles(
  userId: string,
): Promise<RoleKey[]> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("user_roles")
    .select(`
      roles (
        key
      )
    `)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((item) => {
      const role = Array.isArray(item.roles)
        ? item.roles[0]
        : item.roles;

      return role?.key as RoleKey | undefined;
    })
    .filter((role): role is RoleKey => Boolean(role));
}

export async function getUserPermissions(
  userId: string,
): Promise<Permission[]> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("user_roles")
    .select(`
      roles (
        role_permissions (
          permissions (
            key
          )
        )
      )
    `)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  const permissionKeys = new Set<Permission>();

  for (const userRole of data ?? []) {
    const roles = Array.isArray(userRole.roles)
      ? userRole.roles
      : userRole.roles
        ? [userRole.roles]
        : [];

    for (const role of roles) {
      const rolePermissions =
        role?.role_permissions ?? [];

      for (const rolePermission of rolePermissions) {
        const permissions = Array.isArray(
          rolePermission.permissions,
        )
          ? rolePermission.permissions
          : rolePermission.permissions
            ? [rolePermission.permissions]
            : [];

        for (const permission of permissions) {
          if (permission?.key) {
            permissionKeys.add(
              permission.key as Permission,
            );
          }
        }
      }
    }
  }

  return Array.from(permissionKeys);
}

export async function userHasPermission(
  userId: string,
  permission: Permission,
) {
  const permissions = await getUserPermissions(userId);

  return permissions.includes(permission);
}