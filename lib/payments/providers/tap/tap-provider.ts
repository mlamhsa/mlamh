import "server-only";

import type { PaymentProvider } from "../../provider";
import type {
  CreateCheckoutInput,
  CreateCheckoutResult,
  NormalizedProviderPayment,
  RefundPaymentInput,
  RefundResult,
  RetrieveProviderPaymentInput,
  VerifiedWebhookResult,
  VerifyWebhookInput,
} from "../../types";
import { formatProviderAmount, normalizeCurrency } from "../../money";
import { tapRequest } from "./tap-client";
import {
  mapTapChargeToNormalizedPayment,
  mapTapChargeStatus,
} from "./tap-mapper";
import type {
  TapCharge,
  TapCreateChargeResponse,
  TapRefund,
} from "./tap-types";

function sanitizeMetadata(metadata?: Record<string, string>) {
  if (!metadata) return undefined;

  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([key, value]) => key.trim() && value.trim())
      .map(([key, value]) => [key.trim().slice(0, 64), value.trim().slice(0, 255)]),
  );
}

function buildTapCustomer(input: CreateCheckoutInput) {
  return {
    first_name: input.customer.firstName?.trim() || "MLAMH",
    last_name: input.customer.lastName?.trim() || "Customer",
    email: input.customer.email?.trim() || undefined,
  };
}

export const tapPaymentProvider: PaymentProvider = {
  async createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
    const currency = normalizeCurrency(input.currency);

    const charge = await tapRequest<TapCreateChargeResponse>("/charges/", {
      method: "POST",
      idempotencyKey: input.idempotencyKey,
      body: {
        amount: Number(formatProviderAmount(input.amountMinor, currency)),
        currency,
        customer_initiated: true,
        threeDSecure: true,
        save_card: false,
        description: `MLAMH payment ${input.paymentPublicId}`,
        metadata: sanitizeMetadata({
          payment_public_id: input.paymentPublicId,
          user_id: input.customer.userId,
          ...(input.metadata ?? {}),
        }),
        reference: {
          order: input.references.order,
          transaction: input.references.transaction,
          idempotent: input.idempotencyKey,
        },
        customer: buildTapCustomer(input),
        source: {
          id: "src_all",
        },
        post: {
          url: input.webhookUrl,
        },
        redirect: {
          url: input.redirectUrl,
        },
      },
    });

    const checkoutUrl = charge.transaction?.url?.trim();

    if (!checkoutUrl) {
      throw new Error("Tap did not return a checkout URL for the charge.");
    }

    return {
      provider: "tap",
      providerPaymentId: charge.id,
      checkoutUrl,
      rawStatus: charge.status,
    };
  },

  async retrievePayment(
    input: RetrieveProviderPaymentInput,
  ): Promise<NormalizedProviderPayment> {
    const charge = await tapRequest<TapCharge>(
      `/charges/${encodeURIComponent(input.providerPaymentId)}`,
    );

    return mapTapChargeToNormalizedPayment(charge);
  },

  verifyWebhook(_input: VerifyWebhookInput): Promise<VerifiedWebhookResult> {
    throw new Error("Tap webhook verification is not implemented yet.");
  },

  normalizePayment(input: unknown): NormalizedProviderPayment {
    return mapTapChargeToNormalizedPayment(input as TapCharge);
  },

  async refund(input: RefundPaymentInput): Promise<RefundResult> {
    const currency = normalizeCurrency(input.currency);

    const refund = await tapRequest<TapRefund>("/refunds/", {
      method: "POST",
      idempotencyKey: input.idempotencyKey,
      body: {
        charge_id: input.providerPaymentId,
        amount: Number(formatProviderAmount(input.amountMinor, currency)),
        currency,
        reason: input.reason?.trim() || "requested_by_customer",
        reference: {
          idempotent: input.idempotencyKey,
        },
      },
    });

    const rawStatus = refund.status?.trim() || "UNKNOWN";
    const normalizedStatus = rawStatus === "REFUNDED"
      ? "refunded"
      : rawStatus === "REJECTED"
        ? "failed"
        : rawStatus === "PENDING" || rawStatus === "ACCEPTED"
          ? "processing"
          : mapTapChargeStatus(rawStatus);

    return {
      provider: "tap",
      providerRefundId: refund.id,
      status: normalizedStatus,
      rawStatus,
    };
  },
};
