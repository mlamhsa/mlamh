import { NextResponse } from "next/server";

import { registerProviderEvent } from "@/lib/payments/provider-events";
import { tapPaymentProvider } from "@/lib/payments/providers/tap/tap-provider";

export const runtime = "nodejs";

type TapWebhookPayload = {
  id?: unknown;
  object?: unknown;
  status?: unknown;
};

function getWebhookMetadata(payload: unknown) {
  if (typeof payload !== "object" || payload === null) {
    return {
      eventType: null,
      providerObjectId: null,
    };
  }

  const tapPayload = payload as TapWebhookPayload;
  const object = typeof tapPayload.object === "string" ? tapPayload.object.trim() : "";
  const status = typeof tapPayload.status === "string" ? tapPayload.status.trim() : "";

  return {
    eventType: [object, status].filter(Boolean).join(".") || null,
    providerObjectId:
      typeof tapPayload.id === "string" && tapPayload.id.trim()
        ? tapPayload.id.trim()
        : null,
  };
}

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

  const metadata = getWebhookMetadata(verification.rawPayload);
  const registered = await registerProviderEvent({
    provider: "tap",
    providerEventId: verification.providerEventId ?? null,
    eventFingerprint: verification.eventFingerprint,
    eventType: metadata.eventType,
    providerObjectId: metadata.providerObjectId,
    payload: verification.rawPayload,
  });

  if (registered.duplicate) {
    return NextResponse.json(
      {
        ok: true,
        accepted: true,
        duplicate: true,
      },
      { status: 200 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      accepted: true,
      duplicate: false,
      eventId: registered.eventId,
    },
    { status: 202 },
  );
}
