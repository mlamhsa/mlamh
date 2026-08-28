import type {
  CreateCheckoutInput,
  CreateCheckoutResult,
  NormalizedProviderPayment,
  RefundPaymentInput,
  RefundResult,
  RetrieveProviderPaymentInput,
  VerifiedWebhookResult,
  VerifyWebhookInput,
} from "./types";

/**
 * Provider boundary for MLAMH payments.
 * Business logic must depend on this contract, not on Tap-specific payloads.
 */
export interface PaymentProvider {
  createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult>;

  retrievePayment(
    input: RetrieveProviderPaymentInput,
  ): Promise<NormalizedProviderPayment>;

  verifyWebhook(input: VerifyWebhookInput): Promise<VerifiedWebhookResult>;

  normalizePayment(input: unknown): NormalizedProviderPayment;

  refund(input: RefundPaymentInput): Promise<RefundResult>;
}
