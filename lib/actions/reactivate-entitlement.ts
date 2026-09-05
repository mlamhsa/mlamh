"use server";

import { revalidatePath } from "next/cache";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

const DAY_MS = 86_400_000;

function validTime(value: string | null) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

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

export async function reactivateEntitlement(formData: FormData) {
  await requireAdminAccess();

  const rawId = String(formData.get("entitlement_id") ?? "").trim();
  const entitlementId = Number(rawId);
  if (!Number.isInteger(entitlementId) || entitlementId <= 0) {
    throw new Error("Invalid entitlement id.");
  }

  const adminClient = createAdminClient();
  const { data: entitlement, error: loadError } = await adminClient
    .from("entitlements")
    .select("id, status, starts_at, expires_at, created_at, revoked_at, target_type, target_id")
    .eq("id", entitlementId)
    .maybeSingle();

  if (loadError) throw new Error(`Unable to load entitlement: ${loadError.message}`);
  if (!entitlement) throw new Error("Entitlement not found.");

  const originalStart = validTime(entitlement.starts_at) ?? validTime(entitlement.created_at);
  const originalEnd = validTime(entitlement.expires_at);
  const originalDuration = originalStart && originalEnd && originalEnd > originalStart
    ? originalEnd - originalStart
    : null;

  const now = Date.now();
  const startsAt = new Date(now).toISOString();
  const expiresAt = originalDuration
    ? new Date(now + Math.max(originalDuration, DAY_MS)).toISOString()
    : null;

  const { error: updateError } = await adminClient
    .from("entitlements")
    .update({
      status: "active",
      revoked_at: null,
      starts_at: startsAt,
      expires_at: expiresAt,
    })
    .eq("id", entitlementId);

  if (updateError) {
    throw new Error(`Unable to reactivate entitlement: ${updateError.message}`);
  }

  revalidateEntitlementSurfaces(entitlement.target_type, entitlement.target_id);
}
