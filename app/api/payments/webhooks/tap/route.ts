import { NextResponse } from "next/server";

import { tapPaymentProvider } from "@/lib/payments/providers/tap/tap-provider";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();

  if (!rawBody) {
    return NextResponse.json(
      { ok: false, error: "empty_body" },
      { status: 400 },
    );
  }

  const verification = await tapPaymentProvider.verifyWebhook({
    rawBody,
    headers: request.headers,
  });

  if (!verification.valid) {
    return NextResponse.json(
      { ok: false, error: "invalid_signature" },
      { status: 401 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      accepted: true,
      fingerprint: verification.eventFingerprint,
    },
    { status: 202 },
  );
}
