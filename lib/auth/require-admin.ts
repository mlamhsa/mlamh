import { redirect } from "next/navigation";

import { hasValidActiveAdminAssignment } from "@/lib/rbac/admin-access-policy";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const ADMIN_LOGIN_PATH = "/ar/login";
const ADMIN_MFA_PATH = "/admin-mfa";

export async function requireAdminAccess() {
  const authClient = await createServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    redirect(ADMIN_LOGIN_PATH);
  }

  const adminClient = createAdminClient();

  const [
    { data: profile, error: profileError },
    { data: adminRegistry, error: adminRegistryError },
    { data: roleAssignments, error: roleAssignmentsError },
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

  // Admin access is intentionally fail-closed and requires all three layers:
  // 1) the profile is an admin profile,
  // 2) the account is present in the explicit admin registry,
  // 3) exactly one active RBAC role is assigned. RBAC remains the permission source of truth; the registry is the active/revoked gate.
  //
  // This prevents stale profile flags from granting access after an admin is revoked.
  if (
    profileError ||
    adminRegistryError ||
    roleAssignmentsError ||
    !profile ||
    profile.account_type !== "admin" ||
    !adminRegistry ||
    !roleAssignments ||
    !hasValidActiveAdminAssignment(
      adminRegistry.role,
      roleAssignments.map(
        (assignment) => {
          const role =
            Array.isArray(
              assignment.roles,
            )
              ? assignment.roles[0]
              : assignment.roles;

          return role?.key;
        },
      ),
    )
  ) {
    redirect(ADMIN_LOGIN_PATH);
  }

  const assurance = await authClient.auth.mfa.getAuthenticatorAssuranceLevel();

  // Admin access fails closed: a valid admin role alone is not enough.
  // The session must also prove a verified second factor (AAL2).
  if (assurance.error || assurance.data.currentLevel !== "aal2") {
    redirect(ADMIN_MFA_PATH);
  }

  return user;
}
