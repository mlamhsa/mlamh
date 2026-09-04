"use server";

import { revalidatePath } from "next/cache";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function revokeEntitlement(formData: FormData) {
  await requireAdminAccess();

  const rawId = String(formData.get("entitlement_id") ?? "").trim();
  const entitlementId = Number(rawId);
  if (!Number.isInteger(entitlementId) || entitlementId <= 0) {
    throw new Error("Invalid entitlement id.");
  }

  const adminClient = createAdminClient();
  const { data: entitlement, error: loadError } = await adminClient
    .from("entitlements")
    .select("id, status, revoked_at, target_type, target_id")
    .eq("id", entitlementId)
    .maybeSingle();

  if (loadError) throw new Error(`Unable to load entitlement: ${loadError.message}`);
  if (!entitlement) throw new Error("Entitlement not found.");

  if (!entitlement.revoked_at) {
    const { error: updateError } = await adminClient
      .from("entitlements")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", entitlementId)
      .is("revoked_at", null);

    if (updateError) throw new Error(`Unable to revoke entitlement: ${updateError.message}`);
  }

  revalidatePath("/admin/entitlements");
  if (entitlement.target_type === "talent" && entitlement.target_id) {
    revalidatePath(`/admin/talents/${entitlement.target_id}`);
  }
}
