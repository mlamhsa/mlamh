import { createAdminClient } from "@/lib/supabase/admin";
import type { Talent } from "@/lib/types/talent";

type FeaturedEntitlementRow = {
  target_id: string | null;
  starts_at: string | null;
  expires_at: string | null;
};

function isActiveWindow(row: FeaturedEntitlementRow, now: number) {
  if (row.starts_at && new Date(row.starts_at).getTime() > now) return false;
  return !row.expires_at || new Date(row.expires_at).getTime() > now;
}

export async function applyActiveFeaturedTalentEntitlements<T extends Talent>(
  talents: T[],
): Promise<T[]> {
  if (talents.length === 0) return talents;

  const targetIds = talents.map((talent) => String(talent.id));
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("entitlements")
    .select("target_id, starts_at, expires_at")
    .eq("target_type", "talent")
    .eq("entitlement_code", "featured_talent")
    .eq("status", "active")
    .is("revoked_at", null)
    .in("target_id", targetIds);

  if (error) {
    console.error("[applyActiveFeaturedTalentEntitlements]", error);
    return talents.map((talent) => ({ ...talent, featured: false }));
  }

  const now = Date.now();
  const activeIds = new Set(
    ((data ?? []) as FeaturedEntitlementRow[])
      .filter((row) => row.target_id && isActiveWindow(row, now))
      .map((row) => String(row.target_id)),
  );

  return talents.map((talent) => ({
    ...talent,
    featured: activeIds.has(String(talent.id)),
  }));
}
