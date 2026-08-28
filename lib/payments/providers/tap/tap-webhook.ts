import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";

import { formatProviderAmount, majorToMinorAmount, normalizeCurrency } from "../../money";
import type { VerifiedWebhookResult, VerifyWebhookInput } from "../../types";

type TapWebhookPayload = {
  id?: unknown;
  object?: unknown;
  amount?: unknown;
  currency?: unknown;
  status?: unknown;
  created?: unknown;
  updated?: unknown;
  transaction?: {
    created?: unknown;
  } | null;
  reference?: {
    gateway?: unknown;
    payment?: unknown;
  } | null;
};

function getTapSecretKey() {
  const secretKey = process.env.TAP_SECRET_KEY?.trim();

  if (!secretKey) {
    throw new Error("TAP_SECRET_KEY is not configured.");
  }

  return secretKey;
}

function asRequiredString(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Tap webhook is missing ${field}.`);
  }

  return value.trim();
}

function asTimestampString(value: unknown, field: string) {
  if ((typeof value !== "string" && typeof value !== "number") || String(value).trim() === "") {
    throw new Error(`Tap webhook is missing ${field}.`);
  }

  return String(value);
}

function formatWebhookAmount(amount: unknown, currency: string) {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 0) {
    throw new Error("Tap webhook contains an invalid amount.");
  }

  return formatProviderAmount(majorToMinorAmount(amount, currency), currency);
}

function constantTimeHexEqual(expectedHex: string, receivedHex: string) {
  if (!/^[a-f0-9]{64}$/i.test(receivedHex)) return false;

  const expected = Buffer.from(expectedHex, "hex");
  const received = Buffer.from(receivedHex, "hex");

  return expected.length === received.length && timingSafeEqual(expected, received);
}

function buildHashString(payload: TapWebhookPayload) {
  const object = typeof payload.object === "string" ? payload.object.toLowerCase() : "charge";
  const id = asRequiredString(payload.id, "id");
  const currency = normalizeCurrency(asRequiredString(payload.currency, "currency"));
  const amount = formatWebhookAmount(payload.amount, currency);
  const status = asRequiredString(payload.status, "status");
  const created = asTimestampString(payload.transaction?.created ?? payload.created, "created");

  if (object === "invoice") {
    const updated = asTimestampString(payload.updated, "updated");
    return `x_id${id}x_amount${amount}x_currency${currency}x_updated${updated}x_status${status}x_created${created}`;
  }

  const gatewayReference = asRequiredString(payload.reference?.gateway, "reference.gateway");
  const paymentReference = asRequiredString(payload.reference?.payment, "reference.payment");

  return `x_id${id}x_amount${amount}x_currency${currency}x_gateway_reference${gatewayReference}x_payment_reference${paymentReference}x_status${status}x_created${created}`;
}

export function verifyTapWebhook(input: VerifyWebhookInput): VerifiedWebhookResult {
  const postedHashString = input.headers.get("hashstring")?.trim() ?? "";
  const eventFingerprint = createHash("sha256").update(input.rawBody, "utf8").digest("hex");

  let rawPayload: unknown;
  try {
    rawPayload = JSON.parse(input.rawBody) as unknown;
  } catch {
    return { valid: false, eventFingerprint, rawPayload: null };
  }

  if (!postedHashString || typeof rawPayload !== "object" || rawPayload === null) {
    return { valid: false, eventFingerprint, rawPayload };
  }

  try {
    const payload = rawPayload as TapWebhookPayload;
    const toBeHashed = buildHashString(payload);
    const expectedHashString = createHmac("sha256", getTapSecretKey())
      .update(toBeHashed, "utf8")
      .digest("hex");

    return {
      valid: constantTimeHexEqual(expectedHashString, postedHashString),
      providerEventId: null,
      eventFingerprint,
      rawPayload,
    };
  } catch {
    return { valid: false, eventFingerprint, rawPayload };
  }
}
