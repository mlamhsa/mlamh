import { redirect } from "next/navigation";

import { requireAdminAccess } from "@/lib/auth/require-admin";

import type { Permission } from "./permissions";
import { userHasPermission } from "./helpers";

export async function requirePermission(
  permission: Permission,
) {
  const user = await requireAdminAccess();

  const hasPermission = await userHasPermission(
    user.id,
    permission,
  );

  if (!hasPermission) {
    redirect("/admin");
  }

  return user;
}