import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type ActivatePaymentEntitlementInput = {
  paymentId: number;
  entitlementCode: string;
  expiresAt?: string | null;
};

export type ActivatePaymentEntitlementResult = {
  entitlementId: number;
};

function normalizeEntitlementCode(value: string) {
  const normalized = value.trim();

  if (!/^[a-z0-9][a-z0-9_]*$/.test(normalized)) {
    throw new Error("Invalid entitlement code.");
  }

  return normalized;
}

function normalizeExpiry(value?: string | null) {
  if (!value) return null;

  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    throw new Error("Invalid entitlement expiry timestamp.");
  }

  if (timestamp <= Date.now()) {
    throw new Error("Entitlement expiry must be in the future.");
  }

  return new Date(timestamp).toISOString();
}

export async function activatePaymentEntitlement(
  input: ActivatePaymentEntitlementInput,
): Promise<ActivatePaymentEntitlementResult> {
  if (!Number.isSafeInteger(input.paymentId) || input.paymentId <= 0) {
    throw new Error("Invalid payment ID.");
  }

  const entitlementCode = normalizeEntitlementCode(input.entitlementCode);
  const expiresAt = normalizeExpiry(input.expiresAt);
  const adminClient = createAdminClient();

  const { data, error } = await adminClient.rpc("activate_payment_entitlement", {
    p_payment_id: input.paymentId,
    p_entitlement_code: entitlementCode,
    p_expires_at: expiresAt,
  });

  if (error) {
    throw new Error(`Unable to activate payment entitlement: ${error.message}`);
  }

  const entitlementId = Number(data);
  if (!Number.isSafeInteger(entitlementId) || entitlementId <= 0) {
    throw new Error("Payment entitlement activation returned an invalid entitlement ID.");
  }

  return { entitlementId };
}
