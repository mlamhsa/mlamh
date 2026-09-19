"use server";

import { revalidatePath } from "next/cache";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { recordAdminAction } from "@/lib/events/admin-audit";
import { EVENT_TARGETS } from "@/lib/events/event-targets";
import { createAdminClient } from "@/lib/supabase/admin";

function revalidateEntitlementSurfaces(targetType: string | null, targetId: string | null) {
  revalidatePath("/admin/entitlements");

  if (targetType === "talent" && targetId) {
    revalidatePath(`/admin/talents/${targetId}`);
    revalidatePath("/ar");
    revalidatePath("/en");
    revalidatePath("/ar/talent");
    revalidatePath("/en/talent");
  }
}

export async function revokeEntitlement(formData: FormData) {
  const adminUser = await requireAdminAccess();

  const rawId = String(formData.get("entitlement_id") ?? "").trim();
  const entitlementId = Number(rawId);
  if (!Number.isInteger(entitlementId) || entitlementId <= 0) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "revoke_entitlement",
      outcome: "blocked",
      target: EVENT_TARGETS.ENTITLEMENT,
      targetId: "invalid-input",
      reason: "invalid_entitlement_id",
    });
    throw new Error("Invalid entitlement id.");
  }

  const adminClient = createAdminClient();
  const { data: entitlement, error: loadError } = await adminClient
    .from("entitlements")
    .select("id, status, revoked_at, target_type, target_id")
    .eq("id", entitlementId)
    .maybeSingle();

  if (loadError) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "revoke_entitlement",
      outcome: "failed",
      target: EVENT_TARGETS.ENTITLEMENT,
      targetId: entitlementId,
      reason: "entitlement_load_failed",
    });
    throw new Error(`Unable to load entitlement: ${loadError.message}`);
  }
  if (!entitlement) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "revoke_entitlement",
      outcome: "failed",
      target: EVENT_TARGETS.ENTITLEMENT,
      targetId: entitlementId,
      reason: "entitlement_not_found",
    });
    throw new Error("Entitlement not found.");
  }

  if (entitlement.revoked_at) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "revoke_entitlement",
      outcome: "noop",
      target: EVENT_TARGETS.ENTITLEMENT,
      targetId: entitlementId,
      reason: "entitlement_already_revoked",
      metadata: {
        target_type: entitlement.target_type,
        target_id: entitlement.target_id,
      },
    });
  } else {
    const { error: updateError } = await adminClient
      .from("entitlements")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", entitlementId)
      .is("revoked_at", null);

    if (updateError) {
      await recordAdminAction({
        actorId: adminUser.id,
        actorEmail: adminUser.email,
        action: "revoke_entitlement",
        outcome: "failed",
        target: EVENT_TARGETS.ENTITLEMENT,
        targetId: entitlementId,
        reason: "entitlement_revoke_failed",
      });
      throw new Error(`Unable to revoke entitlement: ${updateError.message}`);
    }

    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "revoke_entitlement",
      outcome: "success",
      target: EVENT_TARGETS.ENTITLEMENT,
      targetId: entitlementId,
      metadata: {
        target_type: entitlement.target_type,
        target_id: entitlement.target_id,
      },
    });
  }

  revalidateEntitlementSurfaces(entitlement.target_type, entitlement.target_id);
}
