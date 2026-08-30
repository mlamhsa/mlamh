import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

import { getMarketingChannelAdapter } from "@/lib/marketing/channels/adapters";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  const adapter = getMarketingChannelAdapter(provider);

  if (!adapter || !adapter.verifyWebhook) {
    return NextResponse.json({ ok: false, error: "provider_not_configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  const fingerprint = createHash("sha256")
    .update(`${provider}:${rawBody}`)
    .digest("hex");

  const db = createAdminClient();
  const { data: existing } = await db
    .from("marketing_webhook_events")
    .select("id,processing_status")
    .eq("event_fingerprint", fingerprint)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: true, duplicate: true, status: existing.processing_status });
  }

  const verified = await adapter.verifyWebhook(request.headers, rawBody);
  if (!verified) {
    await db.from("marketing_webhook_events").insert({
      provider,
      event_fingerprint: fingerprint,
      signature_verified: false,
      processing_status: "ignored",
      payload: null,
      last_error: "signature_verification_failed",
    });
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 401 });
  }

  let payload: unknown = null;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    payload = { raw_body_hash: createHash("sha256").update(rawBody).digest("hex") };
  }

  const { error } = await db.from("marketing_webhook_events").insert({
    provider,
    event_fingerprint: fingerprint,
    signature_verified: true,
    processing_status: "received",
    payload,
  });

  if (error) {
    return NextResponse.json({ ok: false, error: "webhook_store_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, accepted: true }, { status: 202 });
}
