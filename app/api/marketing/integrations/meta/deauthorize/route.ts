import { NextResponse } from "next/server";

import { prepareMetaDeauthorize } from "@/lib/marketing/channels/meta-lifecycle";
import {
  META_SECRET_NAMES,
  deleteMetaSecret,
  readMetaSecrets,
  sanitizeMetaInfisicalError,
} from "@/lib/marketing/credentials/meta-infisical";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signedRequest = new URLSearchParams(rawBody).get("signed_request")?.trim() ?? "";
  if (!signedRequest) {
    return NextResponse.json({ ok: false, error: "missing_signed_request" }, { status: 400 });
  }

  const values = await readMetaSecrets([META_SECRET_NAMES.appSecret]).catch(() => null);
  const appSecret = values?.[META_SECRET_NAMES.appSecret];
  if (!appSecret) {
    return NextResponse.json({ ok: false, error: "meta_credentials_unavailable" }, { status: 503 });
  }

  const db = createAdminClient();
  const { data: integration } = await db
    .from("marketing_integrations")
    .select("configuration_state,capabilities")
    .eq("provider", "meta")
    .maybeSingle();

  const plan = prepareMetaDeauthorize({
    signedRequest,
    appSecret,
    configurationState: integration?.configuration_state,
  });
  if (!plan) {
    return NextResponse.json({ ok: false, error: "invalid_signed_request" }, { status: 401 });
  }

  const { data: existing } = await db
    .from("marketing_webhook_events")
    .select("id,processing_status")
    .eq("event_fingerprint", plan.fingerprint)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ ok: true, duplicate: true, status: existing.processing_status });
  }

  let cleanupError: string | null = null;
  for (const secretName of plan.secretsToDelete) {
    try {
      await deleteMetaSecret({ secretName });
    } catch (error) {
      cleanupError = sanitizeMetaInfisicalError(error);
      break;
    }
  }

  const now = new Date().toISOString();
  const nextStatus = cleanupError
    ? "error"
    : plan.remainingCredentialCount > 0
      ? "limited"
      : "setup_required";

  const { error: integrationError } = await db.from("marketing_integrations").upsert({
    provider: "meta",
    status: nextStatus,
    capabilities: plan.remainingCredentialCount > 0
      ? integration?.capabilities ?? {}
      : { publishing: false, insights: false, comments: false, messages: false, webhooks: false },
    configuration_state: {
      ...plan.nextConfiguration,
      oauth_disconnected_at: now,
      last_deauthorize_scope: plan.scope,
    },
    last_sync_at: now,
    last_error: cleanupError ?? (plan.scope === "unmatched" ? "meta_deauthorize_subject_unmatched" : null),
    updated_at: now,
  }, { onConflict: "provider" });

  if (integrationError) {
    return NextResponse.json({ ok: false, error: "deauthorize_state_failed" }, { status: 500 });
  }

  const processingStatus = cleanupError ? "failed" : "processed";
  const { error: auditError } = await db.from("marketing_webhook_events").insert({
    provider: "meta",
    external_event_id: plan.verified.userId,
    event_fingerprint: plan.fingerprint,
    event_type: "meta.deauthorize",
    signature_verified: true,
    processing_status: processingStatus,
    attempt_count: 1,
    payload: {
      meta_user_id: plan.verified.userId,
      scope: plan.scope,
      disconnected_at: now,
      credential_refs_removed: plan.scope === "instagram" ? ["instagram"] : [],
    },
    processed_at: now,
    last_error: cleanupError,
  });

  if (auditError?.code === "23505") {
    return NextResponse.json({ ok: true, duplicate: true });
  }
  if (auditError) {
    return NextResponse.json({ ok: false, error: "deauthorize_audit_failed" }, { status: 500 });
  }

  await db.from("marketing_events").insert({
    event_name: "meta_deauthorized",
    source: "meta",
    medium: plan.scope,
    entity_type: "marketing_integration",
    entity_id: "meta",
    metadata: {
      meta_user_id: plan.verified.userId,
      scope: plan.scope,
      cleanup_status: processingStatus,
    },
    occurred_at: now,
  });

  return NextResponse.json({ ok: true, status: processingStatus });
}
