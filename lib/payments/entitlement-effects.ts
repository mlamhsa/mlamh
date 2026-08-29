import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type ApplyEntitlementEffectInput = {
  entitlementCode: string;
  targetType: string | null;
  targetId: string | null;
  expiresAt: string | null;
};

function parseNumericTargetId(targetId: string | null, label: string) {
  if (!targetId) {
    throw new Error(`${label} entitlement requires a target.`);
  }

  const numericTargetId = Number(targetId);
  if (!Number.isSafeInteger(numericTargetId) || numericTargetId <= 0) {
    throw new Error(`${label} entitlement has an invalid target.`);
  }

  return numericTargetId;
}

export async function applyEntitlementEffect(
  input: ApplyEntitlementEffectInput,
): Promise<void> {
  const adminClient = createAdminClient();

  if (input.entitlementCode === "featured_talent") {
    if (input.targetType !== "talent") {
      throw new Error("Featured talent entitlement requires a talent target.");
    }

    const talentId = parseNumericTargetId(input.targetId, "Featured talent");
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
    return;
  }

  if (input.entitlementCode === "featured_opportunity") {
    if (input.targetType !== "opportunity") {
      throw new Error("Featured opportunity entitlement requires an opportunity target.");
    }

    const opportunityId = parseNumericTargetId(
      input.targetId,
      "Featured opportunity",
    );
    const { error } = await adminClient
      .from("opportunities")
      .update({
        featured: true,
        featured_until: input.expiresAt,
      })
      .eq("id", opportunityId);

    if (error) {
      throw new Error(
        `Unable to apply featured opportunity entitlement: ${error.message}`,
      );
    }
  }
}
