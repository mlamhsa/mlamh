import { createAdminClient } from "@/lib/supabase/admin";
import type { Talent } from "@/lib/types/talent";

type FeaturedEntitlementRow = {
  target_id: string | null;
  status: string | null;
  revoked_at: string | null;
  starts_at: string | null;
  expires_at: string | null;
};

function isActiveWindow(row: FeaturedEntitlementRow, now: number) {
  if (row.starts_at && new Date(row.starts_at).getTime() > now) return false;
  return !row.expires_at || new Date(row.expires_at).getTime() > now;
}

function isActiveFeaturedEntitlement(row: FeaturedEntitlementRow, now: number) {
  return row.status === "active" && !row.revoked_at && isActiveWindow(row, now);
}

async function loadFeaturedEntitlementState<T extends Talent>(talents: T[]) {
  if (talents.length === 0) {
    return {
      activeIds: new Set<string>(),
      managedIds: new Set<string>(),
    };
  }

  const targetIds = talents.map((talent) => String(talent.id));
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("entitlements")
    .select("target_id, status, revoked_at, starts_at, expires_at")
    .eq("target_type", "talent")
    .eq("entitlement_code", "featured_talent")
    .in("target_id", targetIds);

  if (error) {
    console.error("[loadFeaturedEntitlementState]", error);
    return null;
  }

  const now = Date.now();
  const rows = (data ?? []) as FeaturedEntitlementRow[];
  const managedIds = new Set(
    rows
      .filter((row) => row.target_id)
      .map((row) => String(row.target_id)),
  );
  const activeIds = new Set(
    rows
      .filter((row) => row.target_id && isActiveFeaturedEntitlement(row, now))
      .map((row) => String(row.target_id)),
  );

  return { activeIds, managedIds };
}

export async function applyActiveFeaturedTalentEntitlements<T extends Talent>(
  talents: T[],
): Promise<T[]> {
  if (talents.length === 0) return talents;

  const state = await loadFeaturedEntitlementState(talents);
  if (!state) {
    return talents.map((talent) => ({ ...talent, featured: false }));
  }

  return talents.map((talent) => ({
    ...talent,
    featured: state.activeIds.has(String(talent.id)),
  }));
}

export async function getHomepageTalentsWithFeaturedEntitlements<T extends Talent>(
  talents: T[],
): Promise<T[]> {
  if (talents.length === 0) return talents;

  const state = await loadFeaturedEntitlementState(talents);
  if (!state) {
    // Keep the homepage talent section available if entitlement lookup fails,
    // while failing closed on the paid Featured badge itself.
    return talents.map((talent) => ({ ...talent, featured: false }));
  }

  return talents
    .map((talent) => ({
      ...talent,
      featured: state.activeIds.has(String(talent.id)),
    }))
    .filter((talent) => {
      const id = String(talent.id);
      return talent.featured || !state.managedIds.has(id);
    });
}
