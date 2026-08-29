import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type ApplyEntitlementEffectInput = {
  entitlementCode: string;
  targetType: string | null;
  targetId: string | null;
  expiresAt: string | null;
};

export async function applyEntitlementEffect(
  input: ApplyEntitlementEffectInput,
): Promise<void> {
  if (input.entitlementCode !== "featured_talent") return;

  if (input.targetType !== "talent" || !input.targetId) {
    throw new Error("Featured talent entitlement requires a talent target.");
  }

  const talentId = Number(input.targetId);
  if (!Number.isSafeInteger(talentId) || talentId <= 0) {
    throw new Error("Featured talent entitlement has an invalid talent target.");
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("talents")
    .update({
      featured: true,
      featured_until: input.expiresAt,
    })
    .eq("id", talentId);

  if (error) {
    throw new Error(`Unable to apply featured talent entitlement: ${error.message}`);
  }
}
