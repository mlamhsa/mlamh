export const PAYMENT_PROVIDERS = ["tap"] as const;
export type PaymentProviderCode = (typeof PAYMENT_PROVIDERS)[number] | (string & {});

export const PAYMENT_STATUSES = [
  "pending",
  "processing",
  "succeeded",
  "failed",
  "cancelled",
  "partially_refunded",
  "refunded",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_TARGET_TYPES = [
  "account",
  "talent",
  "publisher",
  "opportunity",
] as const;
export type PaymentTargetType = (typeof PAYMENT_TARGET_TYPES)[number];

export const BILLING_TYPES = ["one_time", "recurring"] as const;
export type BillingType = (typeof BILLING_TYPES)[number];

export type CreateCheckoutInput = {
  paymentPublicId: string;
  idempotencyKey: string;
  amountMinor: number;
  currency: string;
  marketCountry: string | null;
  customer: {
    userId: string;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
  };
  references: {
    order: string;
    transaction: string;
  };
  redirectUrl: string;
  webhookUrl: string;
  metadata?: Record<string, string>;
};

export type CreateCheckoutResult = {
  provider: PaymentProviderCode;
  providerPaymentId: string;
  checkoutUrl: string;
  rawStatus: string;
};

export type RetrieveProviderPaymentInput = {
  providerPaymentId: string;
};

export type NormalizedProviderPayment = {
  provider: PaymentProviderCode;
  providerPaymentId: string;
  providerTransactionId?: string | null;
  status: PaymentStatus;
  amountMinor: number;
  currency: string;
  rawStatus: string;
  referenceOrder?: string | null;
  referenceTransaction?: string | null;
};

export type VerifyWebhookInput = {
  rawBody: string;
  headers: Headers;
};

export type VerifiedWebhookResult = {
  valid: boolean;
  providerEventId?: string | null;
  eventFingerprint: string;
  rawPayload: unknown;
};

export type RefundPaymentInput = {
  providerPaymentId: string;
  idempotencyKey: string;
  amountMinor: number;
  currency: string;
  reason?: string | null;
};

export type RefundResult = {
  provider: PaymentProviderCode;
  providerRefundId: string;
  status: PaymentStatus;
  rawStatus: string;
};
