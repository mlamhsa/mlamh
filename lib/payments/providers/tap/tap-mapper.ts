import { majorToMinorAmount, normalizeCurrency } from "../../money";
import type { NormalizedProviderPayment, PaymentStatus } from "../../types";
import type { TapCharge, TapChargeStatus } from "./tap-types";

export function mapTapChargeStatus(status: TapChargeStatus): PaymentStatus {
  switch (status) {
    case "INITIATED":
      return "processing";
    case "CAPTURED":
      return "succeeded";
    case "CANCELLED":
    case "ABANDONED":
    case "VOID":
      return "cancelled";
    case "FAILED":
    case "DECLINED":
    case "RESTRICTED":
    case "TIMEDOUT":
      return "failed";
    case "UNKNOWN":
    default:
      return "processing";
  }
}

export function normalizeTapCharge(charge: TapCharge): NormalizedProviderPayment {
  const currency = normalizeCurrency(charge.currency);

  return {
    provider: "tap",
    providerPaymentId: charge.id,
    providerTransactionId: charge.id,
    status: mapTapChargeStatus(charge.status),
    amountMinor: majorToMinorAmount(charge.amount, currency),
    currency,
    rawStatus: charge.status,
    referenceOrder: charge.reference?.order ?? null,
    referenceTransaction: charge.reference?.transaction ?? null,
  };
}
