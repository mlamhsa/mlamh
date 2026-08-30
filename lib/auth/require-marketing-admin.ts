import { redirect } from "next/navigation";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function requireMarketingAdminAccess(
  permission: "marketing.view" | "marketing.manage" | "marketing.approve" | "marketing.integrations.manage" = "marketing.view",
) {
  const user = await requireAdminAccess();
  const db = createAdminClient();

  const { data, error } = await db
    .from("user_roles")
    .select("roles!inner(key,role_permissions!inner(permissions!inner(key)))")
    .eq("user_id", user.id);

  if (error) {
    console.error("[requireMarketingAdminAccess]", error);
    redirect("/admin");
  }

  const allowed = (data ?? []).some((row) => {
    const roles = Array.isArray(row.roles) ? row.roles : [row.roles];
    return roles.some((role) => {
      if (!role || typeof role !== "object") return false;
      const roleRecord = role as { key?: string; role_permissions?: unknown };
      if (roleRecord.key === "super_admin") return true;
      const rolePermissions = Array.isArray(roleRecord.role_permissions) ? roleRecord.role_permissions : [];
      return rolePermissions.some((entry) => {
        if (!entry || typeof entry !== "object") return false;
        const permissions = (entry as { permissions?: unknown }).permissions;
        const list = Array.isArray(permissions) ? permissions : [permissions];
        return list.some((item) => item && typeof item === "object" && (item as { key?: string }).key === permission);
      });
    });
  });

  if (!allowed) redirect("/admin");
  return user;
}
