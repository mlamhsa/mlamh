import { createAdminClient } from "@/lib/supabase/admin";
import {
  META_SECRET_NAMES,
  getMetaInfisicalConfig,
  readMetaSecrets,
  writeMetaSecret,
} from "@/lib/marketing/credentials/meta-infisical";
import { getMetaAppCredentials, getMetaRuntimeConfig, getMetaWebhookCredentials } from "./meta";
import {
  normalizeWhatsAppWebhookPayload,
  verifyWhatsAppChallenge,
  verifyWhatsAppSignature,
  type NormalizedWhatsAppEvent,
} from "./whatsapp-core";
import type {
  MarketingChannelAdapter,
  MarketingChannelStatus,
  MarketingMessageInput,
  MarketingMessageResult,
} from "./types";

function normalizeStatus(value: unknown): MarketingChannelStatus {
  return value === "connected" || value === "setup_required" || value === "connecting" || value === "error" || value === "paused" || value === "limited"
    ? value
    : "setup_required";
}

function record(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeRecipientPhone(value: unknown) {
  const phone = stringValue(value)?.replace(/[^0-9]/g, "") ?? "";
  return phone.length >= 8 && phone.length <= 15 ? phone : null;
}

function safeWhatsAppError(error: unknown) {
  const message = error instanceof Error ? error.message : "WhatsApp provider request failed.";
  if (/token|bearer|authorization|secret/i.test(message)) return "WhatsApp provider authentication or configuration failed.";
  return message.slice(0, 400);
}

async function getWhatsAppIntegration() {
  const db = createAdminClient();
  const { data, error } = await db.from("marketing_integrations")
    .select("status,configuration_state")
    .eq("provider", "whatsapp")
    .maybeSingle();
  if (error || !data) return null;
  return {
    status: normalizeStatus(data.status),
    configuration: record(data.configuration_state),
  };
}

function connectionDetails(configuration: Record<string, unknown>) {
  const refs = record(configuration.credential_refs);
  return {
    wabaId: stringValue(configuration.waba_id),
    phoneNumberId: stringValue(configuration.phone_number_id),
    displayPhoneNumber: stringValue(configuration.display_phone_number),
    credentialRef: stringValue(refs.whatsapp),
  };
}

async function readWhatsAppAccessToken() {
  const values = await readMetaSecrets([META_SECRET_NAMES.whatsappAccessToken]);
  return values[META_SECRET_NAMES.whatsappAccessToken];
}

export async function getWhatsAppEmbeddedSignupPublicConfig() {
  const values = await readMetaSecrets([META_SECRET_NAMES.appId]);
  const appId = values[META_SECRET_NAMES.appId];
  const configurationId = process.env.META_WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID?.trim() ?? "";
  return {
    appId,
    configurationId,
    ready: Boolean(appId && configurationId),
  };
}

export async function completeWhatsAppEmbeddedSignup({
  code,
  wabaId,
  phoneNumberId,
  displayPhoneNumber,
}: {
  code: string;
  wabaId: string;
  phoneNumberId: string;
  displayPhoneNumber?: string | null;
}) {
  const normalizedCode = code.trim();
  const normalizedWabaId = wabaId.trim();
  const normalizedPhoneNumberId = phoneNumberId.trim();
  if (!normalizedCode || !normalizedWabaId || !normalizedPhoneNumberId) {
    throw new Error("WhatsApp Embedded Signup did not return the required account identifiers.");
  }

  const { appId, appSecret } = await getMetaAppCredentials();
  const config = getMetaRuntimeConfig();
  const tokenUrl = new URL(`${config.graphBaseUrl}/oauth/access_token`);
  tokenUrl.searchParams.set("client_id", appId);
  tokenUrl.searchParams.set("client_secret", appSecret);
  tokenUrl.searchParams.set("code", normalizedCode);

  const tokenResponse = await fetch(tokenUrl.toString(), { cache: "no-store" });
  const tokenPayload = await tokenResponse.json().catch(() => ({})) as { access_token?: string; error?: unknown };
  if (!tokenResponse.ok || tokenPayload.error || !tokenPayload.access_token) {
    throw new Error("WhatsApp Embedded Signup token exchange failed.");
  }

  const subscribeResponse = await fetch(`${config.graphBaseUrl}/${encodeURIComponent(normalizedWabaId)}/subscribed_apps`, {
    method: "POST",
    headers: { Authorization: `Bearer ${tokenPayload.access_token}`, Accept: "application/json" },
    cache: "no-store",
  });
  const subscribePayload = await subscribeResponse.json().catch(() => ({})) as { success?: boolean; error?: unknown };
  if (!subscribeResponse.ok || subscribePayload.error || subscribePayload.success === false) {
    throw new Error("WhatsApp webhook subscription could not be completed.");
  }

  const stored = await writeMetaSecret({
    secretName: META_SECRET_NAMES.whatsappAccessToken,
    secretValue: tokenPayload.access_token,
    config: getMetaInfisicalConfig(),
  });

  const now = new Date().toISOString();
  const db = createAdminClient();
  const { error } = await db.from("marketing_integrations").upsert({
    provider: "whatsapp",
    status: "connected",
    capabilities: {
      messages: true,
      webhooks: true,
      delivery_status: true,
      templates: false,
    },
    configuration_state: {
      technical_provider: "meta_whatsapp_cloud_api",
      onboarding_mode: "embedded_signup_coexistence",
      waba_id: normalizedWabaId,
      phone_number_id: normalizedPhoneNumberId,
      display_phone_number: displayPhoneNumber?.trim() || null,
      credential_refs: { whatsapp: stored.credentialRef },
      credential_store: "infisical",
      webhook_path: "/api/marketing/integrations/whatsapp/webhook",
      connected_at: now,
    },
    last_sync_at: now,
    last_success_at: now,
    last_error: null,
    metadata: { credential_store: "infisical", coexistence: true },
    updated_at: now,
  }, { onConflict: "provider" });
  if (error) throw new Error("WhatsApp connection state could not be persisted.");

  return { ok: true, wabaId: normalizedWabaId, phoneNumberId: normalizedPhoneNumberId };
}

export async function persistWhatsAppConnectionError(error: unknown) {
  const db = createAdminClient();
  const now = new Date().toISOString();
  await db.from("marketing_integrations").upsert({
    provider: "whatsapp",
    status: "error",
    last_sync_at: now,
    last_error: safeWhatsAppError(error),
    updated_at: now,
  }, { onConflict: "provider" });
}

export async function verifyWhatsAppWebhookGet(params: URLSearchParams) {
  const { verifyToken } = await getMetaWebhookCredentials();
  return verifyWhatsAppChallenge({
    mode: params.get("hub.mode"),
    verifyToken: params.get("hub.verify_token"),
    challenge: params.get("hub.challenge"),
    expectedVerifyToken: verifyToken,
  });
}

export async function verifyWhatsAppWebhookPost(headers: Headers, rawBody: string) {
  const { appSecret } = await getMetaWebhookCredentials();
  return verifyWhatsAppSignature({
    rawBody,
    signatureHeader: headers.get("x-hub-signature-256"),
    appSecret,
  });
}

export function normalizeWhatsAppInbound(payload: unknown) {
  return normalizeWhatsAppWebhookPayload(payload);
}

async function ensureWhatsAppConversation(event: Extract<NormalizedWhatsAppEvent, { kind: "message" }>) {
  const db = createAdminClient();
  const { data: existing } = await db.from("marketing_conversations")
    .select("id")
    .eq("channel", "whatsapp")
    .eq("external_thread_id", event.externalThreadId)
    .maybeSingle();
  const now = event.occurredAt ?? new Date().toISOString();
  if (existing?.id) {
    await db.from("marketing_conversations").update({
      assigned_agent_id: "faisal",
      last_message_at: now,
      unread_count: 1,
      updated_at: new Date().toISOString(),
    }).eq("id", existing.id);
    return Number(existing.id);
  }

  const { data: inserted, error } = await db.from("marketing_conversations").insert({
    channel: "whatsapp",
    external_thread_id: event.externalThreadId,
    assigned_agent_id: "faisal",
    status: "open",
    stage: "new",
    last_message_at: now,
    unread_count: 1,
    metadata: { source: "whatsapp_webhook", ...event.metadata },
  }).select("id").single();
  if (error || !inserted) throw new Error("WhatsApp conversation could not be stored.");
  return Number(inserted.id);
}

export async function persistNormalizedWhatsAppEvents(events: NormalizedWhatsAppEvent[]) {
  const db = createAdminClient();
  for (const event of events) {
    if (event.kind === "status") {
      await db.from("marketing_events").insert({
        event_name: `whatsapp_message_${event.status}`,
        source: "whatsapp",
        medium: "whatsapp",
        entity_type: "marketing_message",
        entity_id: event.externalMessageId,
        metadata: {
          external_event_id: event.externalEventId,
          external_message_id: event.externalMessageId,
          recipient_id: event.recipientId,
          ...event.metadata,
        },
        occurred_at: event.occurredAt ?? new Date().toISOString(),
      });
      continue;
    }

    const conversationId = await ensureWhatsAppConversation(event);
    const { error: messageError } = await db.from("marketing_messages").insert({
      conversation_id: conversationId,
      direction: "inbound",
      sender: event.senderId,
      content: event.content,
      message_type: event.messageType,
      external_message_id: event.externalMessageId,
      received_at: event.occurredAt ?? new Date().toISOString(),
      metadata: event.metadata,
    });
    if (messageError && messageError.code !== "23505") throw new Error("WhatsApp inbound message could not be stored.");
    if (messageError?.code === "23505") continue;

    await db.from("marketing_events").insert({
      event_name: "whatsapp_message_received",
      source: "whatsapp",
      medium: "whatsapp",
      entity_type: "marketing_conversation",
      entity_id: String(conversationId),
      metadata: {
        external_event_id: event.externalEventId,
        external_message_id: event.externalMessageId,
      },
      occurred_at: event.occurredAt ?? new Date().toISOString(),
    });

    await db.from("marketing_tasks").insert({
      agent_id: "faisal",
      task_type: "community_reply",
      title: "Review inbound WhatsApp message",
      objective: "Prepare a governed response to the inbound WhatsApp message and update the existing Marketing Hub conversation.",
      priority: "normal",
      status: "queued",
      channel: "whatsapp",
      source: "whatsapp_webhook",
      input: {
        conversation_id: conversationId,
        external_message_id: event.externalMessageId,
        sender_id: event.senderId,
      },
      approval_level: "auto",
      approval_status: "not_required",
      conversation_id: conversationId,
      idempotency_key: `whatsapp-inbound-${event.externalMessageId}`,
      metadata: { outbound_allowed: false },
    });
  }
}

async function sendWhatsAppMessage(input: MarketingMessageInput): Promise<MarketingMessageResult> {
  const integration = await getWhatsAppIntegration();
  if (!integration || integration.status !== "connected") {
    return { ok: false, errorCode: "not_connected", errorMessage: "WhatsApp is not connected." };
  }
  const details = connectionDetails(integration.configuration);
  if (!details.phoneNumberId || !details.credentialRef) {
    return { ok: false, errorCode: "incomplete_connection", errorMessage: "WhatsApp connection is incomplete." };
  }

  const recipientPhone = normalizeRecipientPhone(input.recipient.phone ?? input.recipient.whatsapp ?? input.recipient.to);
  if (!recipientPhone) {
    return { ok: false, errorCode: "invalid_recipient", errorMessage: "WhatsApp recipient phone is invalid." };
  }
  const message = input.text.trim();
  if (!message) return { ok: false, errorCode: "empty_message", errorMessage: "WhatsApp message is empty." };

  try {
    const accessToken = await readWhatsAppAccessToken();
    const config = getMetaRuntimeConfig();
    const response = await fetch(`${config.graphBaseUrl}/${encodeURIComponent(details.phoneNumberId)}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipientPhone,
        type: "text",
        text: { preview_url: false, body: message },
      }),
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({})) as { messages?: Array<{ id?: string }>; error?: { message?: string; code?: number } };
    const externalId = payload.messages?.[0]?.id;
    if (!response.ok || payload.error || !externalId) {
      return {
        ok: false,
        errorCode: payload.error?.code ? `meta_${payload.error.code}` : "provider_error",
        errorMessage: "WhatsApp provider rejected the message.",
      };
    }
    return {
      ok: true,
      externalId,
      metadata: {
        provider: "meta_whatsapp_cloud_api",
        phone_number_id: details.phoneNumberId,
        waba_id: details.wabaId,
      },
    };
  } catch (error) {
    return { ok: false, errorCode: "provider_exception", errorMessage: safeWhatsAppError(error) };
  }
}

export const whatsappServerAdapter: MarketingChannelAdapter = {
  provider: "whatsapp",
  capabilities: ["messages", "webhooks", "delivery_status"],
  async getStatus() {
    const integration = await getWhatsAppIntegration();
    if (!integration) return "setup_required";
    if (integration.status !== "connected") return integration.status;
    const details = connectionDetails(integration.configuration);
    return details.wabaId && details.phoneNumberId && details.credentialRef ? "connected" : "limited";
  },
  sendMessage: sendWhatsAppMessage,
  async verifyWebhook(headers, rawBody) {
    return verifyWhatsAppWebhookPost(headers, rawBody);
  },
};
