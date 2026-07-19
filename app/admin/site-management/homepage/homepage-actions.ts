"use server";

import { revalidatePath } from "next/cache";

import { HomepageService } from "@/lib/services/HomepageService";
import { requirePermission } from "@/lib/rbac/guards";
import { PERMISSIONS } from "@/lib/rbac/permissions";

function revalidateHomepagePaths() {
  revalidatePath("/admin/site-management");
  revalidatePath("/admin/site-management/homepage");

  revalidatePath("/ar");
  revalidatePath("/en");
}

export async function updateHomepageHeroAction(
  id: number,
  data: Record<string, unknown>,
): Promise<void> {
  await requirePermission(PERMISSIONS.CMS_HOMEPAGE_EDIT);

  const result = await HomepageService.updateHero({
    id,
    data,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  revalidateHomepagePaths();
}

export async function updateHomepageHeroCardAction(
  id: number,
  data: Record<string, unknown>,
): Promise<void> {
  await requirePermission(PERMISSIONS.CMS_HOMEPAGE_EDIT);

  const result = await HomepageService.updateHeroCard({
    id,
    data,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  revalidateHomepagePaths();
}