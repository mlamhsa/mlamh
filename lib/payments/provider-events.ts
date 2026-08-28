import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type RegisterProviderEventInput = {
  provider: string;
  providerEventId?: string | null;
  eventFingerprint: string;
  eventType?: string | null;
  providerObjectId?: string | null;
  payload: unknown;
};

export type RegisterProviderEventResult =
  | { duplicate: false; eventId: number }
  | { duplicate: true; eventId: number | null };

export async function registerProviderEvent(
  input: RegisterProviderEventInput,
): Promise<RegisterProviderEventResult> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("payment_provider_events")
    .insert({
      provider: input.provider,
      provider_event_id: input.providerEventId ?? null,
      event_fingerprint: input.eventFingerprint,
      event_type: input.eventType ?? null,
      provider_object_id: input.providerObjectId ?? null,
      signature_verified: true,
      processing_status: "received",
      attempt_count: 1,
      payload: input.payload,
    })
    .select("id")
    .single();

  if (!error) {
    return { duplicate: false, eventId: data.id as number };
  }

  if (error.code !== "23505") {
    throw new Error(`Unable to register provider event: ${error.message}`);
  }

  const { data: existing, error: existingError } = await adminClient
    .from("payment_provider_events")
    .select("id")
    .eq("provider", input.provider)
    .eq("event_fingerprint", input.eventFingerprint)
    .maybeSingle();

  if (existingError) {
    throw new Error(
      `Unable to resolve duplicate provider event: ${existingError.message}`,
    );
  }

  return {
    duplicate: true,
    eventId: existing?.id ? Number(existing.id) : null,
  };
}

export async function markProviderEventProcessing(eventId: number) {
  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("payment_provider_events")
    .update({ processing_status: "processing", last_error: null })
    .eq("id", eventId);

  if (error) {
    throw new Error(`Unable to mark provider event processing: ${error.message}`);
  }
}

export async function markProviderEventProcessed(eventId: number) {
  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("payment_provider_events")
    .update({
      processing_status: "processed",
      processed_at: new Date().toISOString(),
      last_error: null,
    })
    .eq("id", eventId);

  if (error) {
    throw new Error(`Unable to mark provider event processed: ${error.message}`);
  }
}

export async function markProviderEventFailed(eventId: number, errorMessage: string) {
  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("payment_provider_events")
    .update({
      processing_status: "failed",
      last_error: errorMessage.slice(0, 2000),
    })
    .eq("id", eventId);

  if (error) {
    throw new Error(`Unable to mark provider event failed: ${error.message}`);
  }
}
