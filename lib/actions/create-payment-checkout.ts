"use server";

import { createPaymentCheckout } from "@/lib/payments/checkout-service";
import type { PaymentTargetType } from "@/lib/payments/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type CreatePaymentCheckoutActionInput = {
  priceId: number;
  requestKey: string;
  marketCountry?: string | null;
  locale?: string | null;
  target?: {
    type: PaymentTargetType;
    id: string;
  } | null;
};

function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const siteUrl = configuredUrl || "https://mlamh.net";
  return siteUrl.replace(/\/$/, "");
}

function getSafeLocale(locale?: string | null) {
  return locale === "en" ? "en" : "ar";
}

function assertValidRequestKey(requestKey: string) {
  if (
    typeof requestKey !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestKey)
  ) {
    throw new Error("Invalid checkout request key.");
  }
}

export async function createPaymentCheckoutAction(
  input: CreatePaymentCheckoutActionInput,
) {
  if (!Number.isSafeInteger(input.priceId) || input.priceId <= 0) {
    throw new Error("Invalid payment price ID.");
  }
  assertValidRequestKey(input.requestKey);

  const authClient = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    throw new Error("Authentication is required to start checkout.");
  }

  const locale = getSafeLocale(input.locale);
  const siteUrl = getSiteUrl();

  return createPaymentCheckout({
    userId: user.id,
    priceId: input.priceId,
    idempotencyKey: input.requestKey,
    marketCountry: input.marketCountry ?? null,
    target: input.target ?? null,
    customer: {
      email: user.email ?? null,
      phone: user.phone ?? null,
    },
    webhookUrl: `${siteUrl}/api/payments/webhooks/tap`,
    redirectUrl: `${siteUrl}/${locale}/payment/return`,
  });
}
