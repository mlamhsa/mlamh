import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { activatePaymentEntitlement } from "./entitlement-service";
import { applyEntitlementEffect } from "./entitlement-effects";

type EntitlementConfig = {
  code: string;
  duration_days?: number | null;
};

type PaymentForOrchestration = {
  id: number;
  status: string;
  product_id: number;
  target_type: string | null;
  target_id: string | null;
  payment_products: {
    metadata: Record<string, unknown> | null;
  } | null;
};

type ActivatedEntitlementRow = {
  id: number;
  status: string;
  expires_at: string | null;
};

export type PaymentOrchestrationResult = {
  entitlementActivated: boolean;
  entitlementId: number | null;
};

function parseEntitlementConfig(metadata: Record<string, unknown> | null): EntitlementConfig | null {
  const raw = metadata?.entitlement;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;

  const value = raw as Record<string, unknown>;
  const code = typeof value.code === "string" ? value.code.trim() : "";
  if (!/^[a-z0-9][a-z0-9_]*$/.test(code)) {
    throw new Error("Payment product entitlement metadata contains an invalid code.");
  }

  const durationDays = value.duration_days;
  if (durationDays === undefined || durationDays === null) {
    return { code, duration_days: null };
  }

  if (!Number.isSafeInteger(durationDays) || Number(durationDays) <= 0) {
    throw new Error("Payment product entitlement metadata contains an invalid duration_days value.");
  }

  return {
    code,
    duration_days: Number(durationDays),
  };
}

function calculateExpiry(durationDays?: number | null) {
  if (!durationDays) return null;
  return new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
}

function isEntitlementCurrentlyActive(entitlement: ActivatedEntitlementRow) {
  if (entitlement.status !== "active") return false;
  if (!entitlement.expires_at) return true;

  const expiresAt = Date.parse(entitlement.expires_at);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

export async function orchestrateSucceededPayment(
  paymentId: number,
): Promise<PaymentOrchestrationResult> {
  if (!Number.isSafeInteger(paymentId) || paymentId <= 0) {
    throw new Error("Invalid payment ID for orchestration.");
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("payments")
    .select("id, status, product_id, target_type, target_id, payment_products!inner(metadata)")
    .eq("id", paymentId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load payment for orchestration: ${error.message}`);
  }
  if (!data) {
    throw new Error("Payment was not found for orchestration.");
  }

  const payment = data as unknown as PaymentForOrchestration;
  if (payment.status !== "succeeded") {
    return {
      entitlementActivated: false,
      entitlementId: null,
    };
  }

  const config = parseEntitlementConfig(payment.payment_products?.metadata ?? null);
  if (!config) {
    return {
      entitlementActivated: false,
      entitlementId: null,
    };
  }

  const requestedExpiresAt = calculateExpiry(config.duration_days);
  const activated = await activatePaymentEntitlement({
    paymentId: payment.id,
    entitlementCode: config.code,
    expiresAt: requestedExpiresAt,
  });

  const { data: entitlementData, error: entitlementError } = await adminClient
    .from("entitlements")
    .select("id, status, expires_at")
    .eq("id", activated.entitlementId)
    .maybeSingle();

  if (entitlementError || !entitlementData) {
    throw new Error(
      `Unable to load activated payment entitlement: ${entitlementError?.message ?? "entitlement not found"}`,
    );
  }

  const entitlement = entitlementData as ActivatedEntitlementRow;

  if (!isEntitlementCurrentlyActive(entitlement)) {
    return {
      entitlementActivated: false,
      entitlementId: entitlement.id,
    };
  }

  await applyEntitlementEffect({
    entitlementCode: config.code,
    targetType: payment.target_type,
    targetId: payment.target_id,
    expiresAt: entitlement.expires_at,
  });

  return {
    entitlementActivated: true,
    entitlementId: entitlement.id,
  };
}
