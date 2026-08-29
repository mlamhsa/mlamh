import "server-only";

import { randomUUID } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";
import { tapPaymentProvider } from "./providers/tap/tap-provider";
import { normalizeCurrency } from "./money";
import type { PaymentTargetType } from "./types";

type CheckoutTarget = { type: PaymentTargetType; id: string };

export type CreatePaymentCheckoutInput = {
  userId: string;
  priceId: number;
  idempotencyKey: string;
  marketCountry: string | null;
  target?: CheckoutTarget | null;
  customer: { email?: string | null; firstName?: string | null; lastName?: string | null; phone?: string | null };
  redirectUrl: string;
  webhookUrl: string;
};

export type CreatePaymentCheckoutResult = { paymentPublicId: string; checkoutUrl: string };

type CatalogRow = {
  id: number; code: string; currency: string; amount_minor: number;
  billing_type: "one_time" | "recurring"; billing_interval: string | null;
  billing_interval_count: number | null; market_country: string | null; active: boolean;
  valid_from: string | null; valid_until: string | null; metadata: Record<string, unknown> | null;
  payment_products: { id: number; code: string; product_type: string; active: boolean; metadata: Record<string, unknown> | null } | null;
};

type ExistingPayment = {
  id: number; public_id: string; user_id: string; product_id: number; price_id: number;
  target_type: string | null; target_id: string | null; currency: string; amount_minor: number;
};

function normalizeMarketCountry(value: string | null) {
  if (value === null) return null;
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) throw new Error("Invalid ISO 3166-1 alpha-2 market country.");
  return normalized;
}

function assertPriceIsCurrentlyAvailable(price: CatalogRow, marketCountry: string | null) {
  const product = price.payment_products;
  if (!product || !product.active || !price.active) throw new Error("This payment price is not active.");
  const now = Date.now();
  if (price.valid_from && Date.parse(price.valid_from) > now) throw new Error("This payment price is not active yet.");
  if (price.valid_until && Date.parse(price.valid_until) <= now) throw new Error("This payment price is no longer active.");
  if (price.market_country && price.market_country !== marketCountry) throw new Error("This payment price is not available in the selected market.");
  if (price.billing_type !== "one_time") throw new Error("Recurring checkout is not enabled yet.");
}

async function assertSandboxCatalogAccess(userId: string, productMetadata: Record<string, unknown> | null) {
  if (productMetadata?.sandbox_only !== true) return;
  const adminClient = createAdminClient();
  const { data, error } = await adminClient.from("profiles").select("id").eq("user_id", userId).eq("account_type", "admin").maybeSingle();
  if (error) throw new Error(`Unable to validate sandbox payment access: ${error.message}`);
  if (!data) throw new Error("Sandbox payment products are restricted to administrators.");
}

async function assertTargetOwnership(userId: string, target?: CheckoutTarget | null) {
  if (!target) return;
  const adminClient = createAdminClient();
  if (target.type === "account") {
    if (target.id !== userId) throw new Error("Payment target does not belong to the authenticated user.");
    return;
  }
  const numericTargetId = Number(target.id);
  if (!Number.isSafeInteger(numericTargetId) || numericTargetId <= 0) throw new Error("Invalid payment target ID.");
  if (target.type === "talent") {
    const { data, error } = await adminClient.from("talents").select("id").eq("id", numericTargetId).eq("user_id", userId).maybeSingle();
    if (error) throw new Error(`Unable to validate talent ownership: ${error.message}`);
    if (!data) throw new Error("Payment target does not belong to the authenticated user.");
    return;
  }
  const { data: profile, error: profileError } = await adminClient.from("profiles").select("id").eq("user_id", userId).maybeSingle();
  if (profileError) throw new Error(`Unable to validate payment ownership: ${profileError.message}`);
  if (!profile) throw new Error("Authenticated user profile was not found.");
  const { data: publisher, error: publisherError } = await adminClient.from("publishers").select("id").eq("profile_id", profile.id).maybeSingle();
  if (publisherError) throw new Error(`Unable to validate publisher ownership: ${publisherError.message}`);
  if (!publisher) throw new Error("Publisher account was not found for the authenticated user.");
  if (target.type === "publisher") {
    if (Number(publisher.id) !== numericTargetId) throw new Error("Payment target does not belong to the authenticated user.");
    return;
  }
  const { data: opportunity, error: opportunityError } = await adminClient.from("opportunities").select("id").eq("id", numericTargetId).eq("publisher_id", publisher.id).maybeSingle();
  if (opportunityError) throw new Error(`Unable to validate opportunity ownership: ${opportunityError.message}`);
  if (!opportunity) throw new Error("Payment target does not belong to the authenticated user.");
}

function assertExistingPaymentMatches(existing: ExistingPayment, input: CreatePaymentCheckoutInput, productId: number, price: CatalogRow, currency: string) {
  const targetType = input.target?.type ?? null;
  const targetId = input.target?.id ?? null;
  if (
    existing.user_id !== input.userId || existing.product_id !== productId || existing.price_id !== price.id ||
    existing.target_type !== targetType || existing.target_id !== targetId || existing.currency !== currency ||
    Number(existing.amount_minor) !== Number(price.amount_minor)
  ) {
    throw new Error("Checkout request key was already used for a different payment request.");
  }
}

export async function createPaymentCheckout(input: CreatePaymentCheckoutInput): Promise<CreatePaymentCheckoutResult> {
  if (!input.userId.trim()) throw new Error("Authenticated user is required.");
  if (!Number.isSafeInteger(input.priceId) || input.priceId <= 0) throw new Error("Invalid payment price ID.");

  const marketCountry = normalizeMarketCountry(input.marketCountry);
  await assertTargetOwnership(input.userId, input.target);
  const adminClient = createAdminClient();
  const { data, error } = await adminClient.from("payment_prices")
    .select("id, code, currency, amount_minor, billing_type, billing_interval, billing_interval_count, market_country, active, valid_from, valid_until, metadata, payment_products!inner(id, code, product_type, active, metadata)")
    .eq("id", input.priceId).maybeSingle();
  if (error) throw new Error(`Unable to load payment catalog price: ${error.message}`);
  if (!data) throw new Error("Payment price was not found.");

  const price = data as unknown as CatalogRow;
  assertPriceIsCurrentlyAvailable(price, marketCountry);
  const product = price.payment_products;
  if (!product) throw new Error("Payment product was not found.");
  await assertSandboxCatalogAccess(input.userId, product.metadata);

  const currency = normalizeCurrency(price.currency);
  const publicId = randomUUID();
  const targetType = input.target?.type ?? null;
  const targetId = input.target?.id ?? null;
  const priceSnapshot = {
    product_code: product.code, product_type: product.product_type, price_code: price.code,
    currency, amount_minor: price.amount_minor, billing_type: price.billing_type,
    billing_interval: price.billing_interval, billing_interval_count: price.billing_interval_count,
    market_country: price.market_country,
  };

  let payment: { id: number; public_id: string } | null = null;
  const { data: insertedPayment, error: paymentError } = await adminClient.from("payments").insert({
    public_id: publicId, user_id: input.userId, product_id: product.id, price_id: price.id,
    target_type: targetType, target_id: targetId, market_country: marketCountry, currency,
    amount_minor: price.amount_minor, billing_type: price.billing_type, provider: "tap", status: "pending",
    idempotency_key: input.idempotencyKey, product_code_snapshot: product.code,
    price_code_snapshot: price.code, price_snapshot: priceSnapshot,
  }).select("id, public_id").single();

  if (paymentError) {
    if (paymentError.code !== "23505") throw new Error(`Unable to create MLAMH payment: ${paymentError.message}`);
    const { data: existing, error: existingError } = await adminClient.from("payments")
      .select("id, public_id, user_id, product_id, price_id, target_type, target_id, currency, amount_minor")
      .eq("idempotency_key", input.idempotencyKey).maybeSingle();
    if (existingError || !existing) throw new Error("Unable to recover the existing idempotent payment.");
    assertExistingPaymentMatches(existing as ExistingPayment, input, product.id, price, currency);
    payment = { id: Number(existing.id), public_id: String(existing.public_id) };
  } else {
    payment = { id: Number(insertedPayment.id), public_id: String(insertedPayment.public_id) };
  }

  const paymentPublicId = payment.public_id;
  const checkout = await tapPaymentProvider.createCheckout({
    paymentPublicId, idempotencyKey: input.idempotencyKey, amountMinor: price.amount_minor, currency, marketCountry,
    customer: { userId: input.userId, email: input.customer.email, firstName: input.customer.firstName, lastName: input.customer.lastName, phone: input.customer.phone },
    references: { order: paymentPublicId, transaction: paymentPublicId },
    redirectUrl: input.redirectUrl, webhookUrl: input.webhookUrl,
    metadata: { product_code: product.code, price_code: price.code },
  });

  const { error: providerUpdateError } = await adminClient.from("payments")
    .update({ provider_payment_id: checkout.providerPaymentId }).eq("id", payment.id).eq("user_id", input.userId);
  if (providerUpdateError) throw new Error(`Tap checkout was created but MLAMH could not persist the provider payment ID: ${providerUpdateError.message}`);

  return { paymentPublicId, checkoutUrl: checkout.checkoutUrl };
}
