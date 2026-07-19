"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/lib/rbac/guards";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { ValuePropsService } from "@/lib/services/ValuePropsService";

function revalidateValueProps() {
  revalidatePath("/admin/site-management/value-props");

  revalidatePath("/ar");
  revalidatePath("/en");
}

export async function updateValuePropAction(
  id: number,
  data: Record<string, unknown>,
) {
  await requirePermission(
    PERMISSIONS.CMS_HOMEPAGE_EDIT,
  );

  const result = await ValuePropsService.update(
    id,
    data,
  );

  if (result.error) {
    throw new Error(result.error.message);
  }

  revalidateValueProps();
}