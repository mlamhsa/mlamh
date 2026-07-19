"use server";

import { revalidatePath } from "next/cache";

import { FooterService } from "@/lib/services/FooterService";
import { requirePermission } from "@/lib/rbac/guards";
import { PERMISSIONS } from "@/lib/rbac/permissions";

function revalidateFooterPaths() {
  revalidatePath("/admin/footer");
  revalidatePath("/admin/site-management");
  revalidatePath("/admin/site-management/footer");

  revalidatePath("/ar");
  revalidatePath("/en");
}

export async function updateFooterSettingsAction(
  data: Record<string, unknown>,
): Promise<void> {
  await requirePermission(PERMISSIONS.CMS_FOOTER_EDIT);

  const result = await FooterService.updateSettings(data);

  if (result.error) {
    throw new Error(result.error.message);
  }

  revalidateFooterPaths();
}

export async function createFooterLinkAction(
  data: Record<string, unknown>,
): Promise<void> {
  await requirePermission(PERMISSIONS.CMS_FOOTER_EDIT);

  const result = await FooterService.createLink(data);

  if (result.error) {
    throw new Error(result.error.message);
  }

  revalidateFooterPaths();
}

export async function updateFooterLinkAction(
  id: number,
  data: Record<string, unknown>,
): Promise<void> {
  await requirePermission(PERMISSIONS.CMS_FOOTER_EDIT);

  const result = await FooterService.updateLink({
    id,
    data,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  revalidateFooterPaths();
}

export async function deleteFooterLinkAction(
  id: number,
): Promise<void> {
  await requirePermission(PERMISSIONS.CMS_FOOTER_EDIT);

  const result = await FooterService.deleteLink(id);

  if (result.error) {
    throw new Error(result.error.message);
  }

  revalidateFooterPaths();
}