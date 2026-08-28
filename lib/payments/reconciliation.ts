import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeCurrency } from "./money";
import type { NormalizedProviderPayment } from "./types";

type PaymentRow = {
  id: number;
  public_id: string;
  user_id: string;
  provider: string | null;
  provider_payment_id: string | null;
  status: string;
  amount_minor: number;
  currency: string;
};

export type ReconciledPayment = {
  payment: PaymentRow;
  providerPayment: NormalizedProviderPayment;
};

function assertProviderPaymentMatches(
  payment: PaymentRow,
  providerPayment: NormalizedProviderPayment,
) {
  if (providerPayment.provider !== "tap") {
    throw new Error("Unexpected payment provider during Tap reconciliation.");
  }

  if (payment.provider !== "tap") {
    throw new Error("MLAMH payment is not assigned to Tap.");
  }

  if (providerPayment.referenceOrder !== payment.public_id) {
    throw new Error("Provider order reference does not match the MLAMH payment.");
  }

  if (providerPayment.referenceTransaction !== payment.public_id) {
    throw new Error("Provider transaction reference does not match the MLAMH payment.");
  }

  if (
    payment.provider_payment_id &&
    payment.provider_payment_id !== providerPayment.providerPaymentId
  ) {
    throw new Error("Provider payment ID does not match the MLAMH payment.");
  }

  if (payment.amount_minor !== providerPayment.amountMinor) {
    throw new Error("Provider amount does not match the MLAMH payment.");
  }

  if (normalizeCurrency(payment.currency) !== normalizeCurrency(providerPayment.currency)) {
    throw new Error("Provider currency does not match the MLAMH payment.");
  }
}

export async function validateTapPaymentForReconciliation(
  providerPayment: NormalizedProviderPayment,
): Promise<ReconciledPayment> {
  const referenceOrder = providerPayment.referenceOrder?.trim();

  if (!referenceOrder) {
    throw new Error("Tap payment is missing the MLAMH order reference.");
  }

  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("payments")
    .select(
      "id, public_id, user_id, provider, provider_payment_id, status, amount_minor, currency",
    )
    .eq("public_id", referenceOrder)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load payment for reconciliation: ${error.message}`);
  }

  if (!data) {
    throw new Error("No MLAMH payment matches the provider order reference.");
  }

  const payment = data as PaymentRow;
  assertProviderPaymentMatches(payment, providerPayment);

  return {
    payment,
    providerPayment,
  };
}

export async function reconcileTapPayment(
  providerPayment: NormalizedProviderPayment,
): Promise<ReconciledPayment> {
  const reconciled = await validateTapPaymentForReconciliation(providerPayment);
  const adminClient = createAdminClient();

  const { error } = await adminClient.rpc("reconcile_payment_charge", {
    p_payment_id: reconciled.payment.id,
    p_provider: providerPayment.provider,
    p_provider_payment_id: providerPayment.providerPaymentId,
    p_provider_transaction_id:
      providerPayment.providerTransactionId ?? providerPayment.providerPaymentId,
    p_status: providerPayment.status,
    p_provider_status: providerPayment.rawStatus,
    p_currency: providerPayment.currency,
    p_amount_minor: providerPayment.amountMinor,
  });

  if (error) {
    throw new Error(`Unable to reconcile payment atomically: ${error.message}`);
  }

  return reconciled;
}
