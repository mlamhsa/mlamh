import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

import {
  normalizeMetaInbound,
  persistNormalizedMetaInbound,
  verifyMetaWebhookGet,
  verifyMetaWebhookPost,
} from "@/lib/marketing/channels/meta";
import { buildMetaWebhookFingerprint } from "@/lib/marketing/channels/meta-core";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const challenge = await verifyMetaWebhookGet(new URL(request.url).searchParams).catch(() => null);
  if (!challenge) {
    return new NextResponse("verification_failed", { status: 403 });
  }
  return new NextResponse(challenge, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signatureVerified = await verifyMetaWebhookPost(request.headers, rawBody).catch(() => false);
  const db = createAdminClient();

  if (!signatureVerified) {
    const invalidFingerprint = createHash("sha256")
      .update(`meta:invalid-signature:${rawBody}`)
      .digest("hex");
    await db.from("marketing_webhook_events").upsert({
      provider: "meta",
      event_fingerprint: invalidFingerprint,
      event_type: "invalid_signature",
      signature_verified: false,
      processing_status: "ignored",
      payload: null,
      last_error: "signature_verification_failed",
    }, { onConflict: "event_fingerprint", ignoreDuplicates: true });
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 401 });
  }

  const fingerprint = buildMetaWebhookFingerprint(rawBody);
  const { data: existing } = await db
    .from("marketing_webhook_events")
    .select("id,processing_status")
    .eq("event_fingerprint", fingerprint)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: true, duplicate: true, status: existing.processing_status });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    await db.from("marketing_webhook_events").insert({
      provider: "meta",
      event_fingerprint: fingerprint,
      event_type: "invalid_json",
      signature_verified: true,
      processing_status: "ignored",
      payload: null,
      last_error: "invalid_json",
    });
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const normalized = normalizeMetaInbound(payload);
  const { data: webhookEvent, error: insertError } = await db
    .from("marketing_webhook_events")
    .insert({
      provider: "meta",
      event_fingerprint: fingerprint,
      event_type: normalized.length === 1
        ? `meta.${normalized[0].channel}.${normalized[0].eventType}`
        : "meta.batch",
      signature_verified: true,
      processing_status: "processing",
      attempt_count: 1,
      payload,
    })
    .select("id")
    .single();

  if (insertError || !webhookEvent) {
    if (insertError?.code === "23505") {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    return NextResponse.json({ ok: false, error: "webhook_store_failed" }, { status: 500 });
  }

  try {
    await persistNormalizedMetaInbound(normalized);
    await db.from("marketing_webhook_events").update({
      processing_status: normalized.length > 0 ? "processed" : "ignored",
      processed_at: new Date().toISOString(),
      last_error: null,
    }).eq("id", webhookEvent.id);
    return NextResponse.json({ ok: true, accepted: true, events: normalized.length }, { status: 200 });
  } catch {
    await db.from("marketing_webhook_events").update({
      processing_status: "failed",
      processed_at: new Date().toISOString(),
      last_error: "meta_webhook_processing_failed",
    }).eq("id", webhookEvent.id);
    return NextResponse.json({ ok: false, error: "webhook_processing_failed" }, { status: 500 });
  }
}
