import { NextResponse } from "next/server";

import { prepareMetaDataDeletion } from "@/lib/marketing/channels/meta-lifecycle";
import {
  META_SECRET_NAMES,
  readMetaSecrets,
} from "@/lib/marketing/credentials/meta-infisical";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signedRequest = new URLSearchParams(rawBody).get("signed_request")?.trim() ?? "";
  if (!signedRequest) {
    return NextResponse.json({ error: "missing_signed_request" }, { status: 400 });
  }

  const values = await readMetaSecrets([META_SECRET_NAMES.appSecret]).catch(() => null);
  const appSecret = values?.[META_SECRET_NAMES.appSecret];
  if (!appSecret) {
    return NextResponse.json({ error: "meta_credentials_unavailable" }, { status: 503 });
  }

  const plan = prepareMetaDataDeletion({
    signedRequest,
    appSecret,
    requestUrl: request.url,
  });
  if (!plan) {
    return NextResponse.json({ error: "invalid_signed_request" }, { status: 401 });
  }

  const db = createAdminClient();
  const { data: existing } = await db
    .from("marketing_webhook_events")
    .select("id,processing_status,payload")
    .eq("event_fingerprint", plan.fingerprint)
    .maybeSingle();

  if (existing) {
    const payload = asRecord(existing.payload);
    return NextResponse.json({
      url: asString(payload.status_url) ?? plan.statusUrl,
      confirmation_code: asString(payload.confirmation_code) ?? plan.confirmationCode,
    });
  }

  const now = new Date().toISOString();
  const { error } = await db.from("marketing_webhook_events").insert({
    provider: "meta",
    external_event_id: plan.verified.userId,
    event_fingerprint: plan.fingerprint,
    event_type: "meta.data_deletion_request",
    signature_verified: true,
    processing_status: "received",
    attempt_count: 1,
    payload: {
      meta_user_id: plan.verified.userId,
      confirmation_code: plan.confirmationCode,
      status_url: plan.statusUrl,
      requested_at: now,
      deletion_status: "pending_privacy_review",
      retention_policy_required: true,
    },
    last_error: null,
  });

  if (error?.code === "23505") {
    return NextResponse.json({
      url: plan.statusUrl,
      confirmation_code: plan.confirmationCode,
    });
  }
  if (error) {
    return NextResponse.json({ error: "data_deletion_request_store_failed" }, { status: 500 });
  }

  await db.from("marketing_events").insert({
    event_name: "meta_data_deletion_requested",
    source: "meta",
    medium: "privacy",
    entity_type: "marketing_webhook_event",
    entity_id: plan.confirmationCode,
    metadata: {
      meta_user_id: plan.verified.userId,
      confirmation_code: plan.confirmationCode,
      deletion_status: "pending_privacy_review",
    },
    occurred_at: now,
  });

  return NextResponse.json({
    url: plan.statusUrl,
    confirmation_code: plan.confirmationCode,
  });
}
