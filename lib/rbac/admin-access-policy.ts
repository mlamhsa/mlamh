import {
  ROLES,
  type RoleKey,
} from "./roles.ts";

export const ACTIVE_ADMIN_ACCESS_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
] as const satisfies readonly RoleKey[];

export const ASSIGNABLE_ADMIN_ROLES =
  ACTIVE_ADMIN_ACCESS_ROLES;

export type ActiveAdminAccessRole =
  (typeof ACTIVE_ADMIN_ACCESS_ROLES)[number];

export function isActiveAdminAccessRole(
  value: string | null | undefined,
): value is ActiveAdminAccessRole {
  return ACTIVE_ADMIN_ACCESS_ROLES.includes(
    value as ActiveAdminAccessRole,
  );
}

export function isAssignableAdminRole(
  value: string | null | undefined,
): value is ActiveAdminAccessRole {
  return ASSIGNABLE_ADMIN_ROLES.includes(
    value as ActiveAdminAccessRole,
  );
}


export function hasConsistentActiveAdminRole(
  registryRole: string | null | undefined,
  assignedRoleKeys: Array<
    string | null | undefined
  >,
) {
  if (
    !isActiveAdminAccessRole(
      registryRole,
    )
  ) {
    return false;
  }

  const normalized =
    assignedRoleKeys.filter(
      (
        value,
      ): value is string =>
        Boolean(value),
    );

  return (
    normalized.length === 1 &&
    normalized[0] ===
      registryRole &&
    isActiveAdminAccessRole(
      normalized[0],
    )
  );
}
