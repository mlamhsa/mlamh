import { redirect } from "next/navigation";

import { hasValidActiveAdminAssignment } from "@/lib/rbac/admin-access-policy";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const ADMIN_LOGIN_PATH = "/ar/login";
const ADMIN_MFA_PATH = "/admin-mfa";

async function requireAdminIdentityInternal() {
  const authClient =
    await createServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } =
    await authClient.auth.getUser();

  if (userError || !user) {
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
  if (
    profileError ||
    adminRegistryError ||
    roleAssignmentsError ||
    !profile ||
    profile.account_type !==
      "admin" ||
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

  return user;
}
