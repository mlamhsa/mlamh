import type { PaymentStatus } from "./types";

const TERMINAL_PAYMENT_STATUSES = new Set<PaymentStatus>([
  "failed",
  "cancelled",
  "refunded",
]);

export function isTerminalPaymentStatus(status: PaymentStatus) {
  return TERMINAL_PAYMENT_STATUSES.has(status);
}

export function isSuccessfulPaymentStatus(status: PaymentStatus) {
  return status === "succeeded" || status === "partially_refunded";
}

export function canActivateEntitlement(status: PaymentStatus) {
  return status === "succeeded";
}
