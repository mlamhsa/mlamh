import { NextResponse } from "next/server";

import { reconcileManagedCastingTapCharge } from "@/lib/casting/managed-payment-reconciliation";
import { tapPaymentProvider } from "@/lib/payments/providers/tap/tap-provider";
import {
  readTextBodyWithLimit,
  RequestBodyTooLargeError,
} from "@/lib/security/request-guards";

export const runtime = "nodejs";

const MAX_WEBHOOK_BODY_BYTES = 256 * 1024;

type TapPayload = { id?: unknown };

function providerObjectId(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const id = (payload as TapPayload).id;
  return typeof id === "string" && id.trim() ? id.trim() : null;
}

export async function POST(request: Request) {
  let rawBody: string;

  try {
    rawBody = await readTextBodyWithLimit(request, MAX_WEBHOOK_BODY_BYTES);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json(
        { ok: false, error: "payload_too_large" },
        { status: 413 },
      );
    }

    return NextResponse.json(
      { ok: false, error: "invalid_body" },
      { status: 400 },
    );
  }

  if (!rawBody) {
    return NextResponse.json({ ok: false, error: "empty_body" }, { status: 400 });
  }

  const verification = await tapPaymentProvider.verifyWebhook({ rawBody, headers: request.headers });
  if (!verification.valid) {
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 401 });
  }

  const chargeId = providerObjectId(verification.rawPayload);
  if (!chargeId) return NextResponse.json({ ok: false, error: "missing_charge_id" }, { status: 400 });

  try {
    const result = await reconcileManagedCastingTapCharge(chargeId);
    if (!result.found) {
      return NextResponse.json({ ok: true, accepted: true, ignored: true }, { status: 200 });
    }

    return NextResponse.json({ ok: true, accepted: true, status: result.status }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown reconciliation error";
    console.error("[managed casting webhook] processing failed", { chargeId, error: message });
    const mismatch = message.includes("amount or currency mismatch");
    return NextResponse.json(
      { ok: false, error: mismatch ? "payment_mismatch" : "processing_failed" },
      { status: mismatch ? 409 : 500 },
    );
  }
}
