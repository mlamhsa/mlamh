import { randomBytes } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  META_SECRET_NAMES,
  buildMetaCredentialRef,
  getMetaInfisicalConfig,
  readMetaSecrets,
  sanitizeMetaInfisicalError,
  writeMetaSecret,
} from "@/lib/marketing/credentials/meta-infisical";

import {
  buildMetaInboundTaskCandidate,
  normalizeMetaWebhookPayload,
  verifyMetaSignature,
  verifyMetaWebhookChallenge,
  type NormalizedMetaInbound,
} from "./meta-core";
import type { MarketingChannelAdapter, MarketingChannelStatus } from "./types";

const META_OAUTH_REDIRECT_URI = "https://mlamh.net/api/marketing/integrations/meta/callback";
const META_INSTAGRAM_OAUTH_REDIRECT_URI = "https://mlamh.net/api/marketing/integrations/meta/instagram/callback";

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

export type MetaRuntimeConfig = {
  graphVersion: string;
  graphBaseUrl: string;
  facebookOAuthRedirectUri: string;
  instagramOAuthRedirectUri: string;
};

export function getMetaRuntimeConfig(): MetaRuntimeConfig {
  const graphVersion = requiredEnv("META_GRAPH_API_VERSION");
  if (!/^v\d+\.\d+$/.test(graphVersion)) throw new Error("META_GRAPH_API_VERSION is invalid.");
  return {
    graphVersion,
    graphBaseUrl: `https://graph.facebook.com/${graphVersion}`,
    facebookOAuthRedirectUri: process.env.META_OAUTH_REDIRECT_URI?.trim() || META_OAUTH_REDIRECT_URI,
    instagramOAuthRedirectUri: process.env.META_INSTAGRAM_OAUTH_REDIRECT_URI?.trim() || META_INSTAGRAM_OAUTH_REDIRECT_URI,
  };
}

export async function getMetaAppCredentials() {
  const values = await readMetaSecrets([META_SECRET_NAMES.appId, META_SECRET_NAMES.appSecret]);
  return {
    appId: values[META_SECRET_NAMES.appId],
    appSecret: values[META_SECRET_NAMES.appSecret],
  };
}

export async function getMetaWebhookCredentials() {
  const values = await readMetaSecrets([META_SECRET_NAMES.appSecret, META_SECRET_NAMES.webhookVerifyToken]);
  return {
    appSecret: values[META_SECRET_NAMES.appSecret],
    verifyToken: values[META_SECRET_NAMES.webhookVerifyToken],
  };
}

export async function createFacebookOAuthRequest() {
  const { appId } = await getMetaAppCredentials();
  const config = getMetaRuntimeConfig();
  const state = randomBytes(32).toString("base64url");
  const url = new URL(`https://www.facebook.com/${config.graphVersion}/dialog/oauth`);
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", config.facebookOAuthRedirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", [
    "public_profile",
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_posts",
    "pages_manage_engagement",
    "pages_manage_metadata",
    "read_insights",
    "business_management",
  ].join(","));
  return { authorizationUrl: url.toString(), state };
}

export async function createInstagramOAuthRequest() {
  const { appId } = await getMetaAppCredentials();
  const config = getMetaRuntimeConfig();
  const state = randomBytes(32).toString("base64url");
  const url = new URL("https://www.instagram.com/oauth/authorize");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", config.instagramOAuthRedirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  url.searchParams.set("enable_fb_login", "0");
  url.searchParams.set("force_authentication", "1");
  url.searchParams.set("scope", [
    "instagram_business_basic",
    "instagram_business_manage_comments",
    "instagram_business_manage_messages",
  ].join(","));
  return { authorizationUrl: url.toString(), state };
}

async function graphJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: "no-store" });
  const payload = await response.json().catch(() => ({})) as T & { error?: unknown };
  if (!response.ok || payload.error) throw new Error("Meta API request failed.");
  return payload;
}

export async function completeFacebookOAuth(code: string) {
  const { appId, appSecret } = await getMetaAppCredentials();
  const config = getMetaRuntimeConfig();
  const tokenUrl = new URL(`${config.graphBaseUrl}/oauth/access_token`);
  tokenUrl.searchParams.set("client_id", appId);
  tokenUrl.searchParams.set("client_secret", appSecret);
  tokenUrl.searchParams.set("redirect_uri", config.facebookOAuthRedirectUri);
  tokenUrl.searchParams.set("code", code);
  const shortLived = await graphJson<{ access_token?: string }>(tokenUrl.toString());
  if (!shortLived.access_token) throw new Error("Meta OAuth did not return an access token.");

  const longLivedUrl = new URL(`${config.graphBaseUrl}/oauth/access_token`);
  longLivedUrl.searchParams.set("grant_type", "fb_exchange_token");
  longLivedUrl.searchParams.set("client_id", appId);
  longLivedUrl.searchParams.set("client_secret", appSecret);
  longLivedUrl.searchParams.set("fb_exchange_token", shortLived.access_token);
  const longLived = await graphJson<{ access_token?: string }>(longLivedUrl.toString());
  if (!longLived.access_token) throw new Error("Meta long-lived token exchange failed.");

  const pagesUrl = new URL(`${config.graphBaseUrl}/me/accounts`);
  pagesUrl.searchParams.set("fields", "id,name,access_token,instagram_business_account{id,username}");
  pagesUrl.searchParams.set("access_token", longLived.access_token);
  const pagesPayload = await graphJson<{
    data?: Array<{
      id?: string;
      name?: string;
      access_token?: string;
      instagram_business_account?: { id?: string; username?: string };
    }>;
  }>(pagesUrl.toString());

  const pages = (pagesPayload.data ?? []).filter((page) => page.id && page.access_token);
  if (pages.length === 0) throw new Error("No manageable Facebook Page was returned by Meta.");

  const pageTokens = Object.fromEntries(pages.map((page) => [page.id as string, page.access_token as string]));
  const infisical = getMetaInfisicalConfig();
  const userStored = await writeMetaSecret({
    secretName: META_SECRET_NAMES.facebookLongLivedUserToken,
    secretValue: longLived.access_token,
    config: infisical,
  });
  const pagesStored = await writeMetaSecret({
    secretName: META_SECRET_NAMES.facebookPageTokens,
    secretValue: JSON.stringify(pageTokens),
    config: infisical,
  });

  await persistMetaConnection({
    facebookPages: pages.map((page) => ({
      id: page.id as string,
      name: page.name ?? null,
      instagramAccountId: page.instagram_business_account?.id ?? null,
      instagramUsername: page.instagram_business_account?.username ?? null,
    })),
    credentialRefs: {
      facebook_user: userStored.credentialRef,
      facebook_pages: pagesStored.credentialRef,
    },
  });
}

export async function completeInstagramOAuth(code: string) {
  const { appId, appSecret } = await getMetaAppCredentials();
  const config = getMetaRuntimeConfig();
  const body = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    grant_type: "authorization_code",
    redirect_uri: config.instagramOAuthRedirectUri,
    code,
  });
  const shortResponse = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  const shortPayload = await shortResponse.json().catch(() => ({})) as { access_token?: string; user_id?: string; error?: unknown };
  if (!shortResponse.ok || shortPayload.error || !shortPayload.access_token) throw new Error("Instagram OAuth token exchange failed.");

  const longUrl = new URL("https://graph.instagram.com/access_token");
  longUrl.searchParams.set("grant_type", "ig_exchange_token");
  longUrl.searchParams.set("client_secret", appSecret);
  longUrl.searchParams.set("access_token", shortPayload.access_token);
  const longPayload = await graphJson<{ access_token?: string }>(longUrl.toString());
  if (!longPayload.access_token) throw new Error("Instagram long-lived token exchange failed.");

  const stored = await writeMetaSecret({
    secretName: META_SECRET_NAMES.instagramLongLivedToken,
    secretValue: longPayload.access_token,
  });
  await persistMetaConnection({
    instagramLoginAccountId: shortPayload.user_id ?? null,
    credentialRefs: { instagram: stored.credentialRef },
  });
}

async function persistMetaConnection({
  facebookPages,
  instagramLoginAccountId,
  credentialRefs,
}: {
  facebookPages?: Array<{ id: string; name: string | null; instagramAccountId: string | null; instagramUsername: string | null }>;
  instagramLoginAccountId?: string | null;
  credentialRefs: Record<string, string>;
}) {
  const db = createAdminClient();
  const { data } = await db.from("marketing_integrations")
    .select("configuration_state")
    .eq("provider", "meta")
    .maybeSingle();
  const previous = data?.configuration_state && typeof data.configuration_state === "object" && !Array.isArray(data.configuration_state)
    ? data.configuration_state as Record<string, unknown>
    : {};
  const previousRefs = previous.credential_refs && typeof previous.credential_refs === "object" && !Array.isArray(previous.credential_refs)
    ? previous.credential_refs as Record<string, unknown>
    : {};
  const now = new Date().toISOString();
  const configurationState = {
    ...previous,
    technical_provider: "meta",
    facebook_pages: facebookPages ?? previous.facebook_pages ?? [],
    instagram_login_account_id: instagramLoginAccountId ?? previous.instagram_login_account_id ?? null,
    credential_refs: { ...previousRefs, ...credentialRefs },
    credential_store: "infisical",
    webhook_path: "/api/marketing/integrations/meta/webhook",
    oauth_connected_at: now,
  };
  const { error } = await db.from("marketing_integrations").upsert({
    provider: "meta",
    status: "connected",
    capabilities: {
      publishing: false,
      insights: false,
      comments: true,
      messages: true,
      webhooks: true,
    },
    configuration_state: configurationState,
    last_sync_at: now,
    last_success_at: now,
    last_error: null,
    metadata: { credential_store: "infisical" },
    updated_at: now,
  }, { onConflict: "provider" });
  if (error) throw new Error("Meta connection state could not be persisted.");
}

export async function persistMetaConnectionError(error: unknown) {
  const db = createAdminClient();
  const now = new Date().toISOString();
  await db.from("marketing_integrations").upsert({
    provider: "meta",
    status: "error",
    last_sync_at: now,
    last_error: sanitizeMetaInfisicalError(error),
    updated_at: now,
  }, { onConflict: "provider" });
}

export async function verifyMetaWebhookGet(params: URLSearchParams) {
  const { verifyToken } = await getMetaWebhookCredentials();
  return verifyMetaWebhookChallenge({
    mode: params.get("hub.mode"),
    verifyToken: params.get("hub.verify_token"),
    challenge: params.get("hub.challenge"),
    expectedVerifyToken: verifyToken,
  });
}

export async function verifyMetaWebhookPost(headers: Headers, rawBody: string) {
  const { appSecret } = await getMetaWebhookCredentials();
  return verifyMetaSignature({
    rawBody,
    signatureHeader: headers.get("x-hub-signature-256"),
    appSecret,
  });
}

async function ensureConversation(event: NormalizedMetaInbound) {
  const db = createAdminClient();
  const { data: existing } = await db.from("marketing_conversations")
    .select("id")
    .eq("channel", event.channel)
    .eq("external_thread_id", event.externalThreadId)
    .maybeSingle();
  const now = event.occurredAt ?? new Date().toISOString();
  if (existing?.id) {
    await db.from("marketing_conversations").update({
      assigned_agent_id: "faisal",
      last_message_at: now,
      updated_at: new Date().toISOString(),
    }).eq("id", existing.id);
    return Number(existing.id);
  }
  const { data: inserted, error } = await db.from("marketing_conversations").insert({
    channel: event.channel,
    external_thread_id: event.externalThreadId,
    assigned_agent_id: "faisal",
    status: "open",
    stage: "new",
    last_message_at: now,
    unread_count: 1,
    metadata: { source: "meta_webhook", surface: event.channel },
  }).select("id").single();
  if (error || !inserted) throw new Error("Meta conversation could not be stored.");
  return Number(inserted.id);
}

export async function persistNormalizedMetaInbound(events: NormalizedMetaInbound[]) {
  const db = createAdminClient();
  for (const event of events) {
    const conversationId = await ensureConversation(event);
    const { error: messageError } = await db.from("marketing_messages").insert({
      conversation_id: conversationId,
      direction: "inbound",
      sender: event.senderId,
      content: event.content,
      message_type: event.eventType,
      external_message_id: event.externalMessageId,
      received_at: event.occurredAt ?? new Date().toISOString(),
      metadata: event.metadata,
    });
    if (messageError && messageError.code !== "23505") throw new Error("Meta inbound message could not be stored.");
    if (messageError?.code === "23505") continue;

    await db.from("marketing_events").insert({
      event_name: `meta_${event.channel}_${event.eventType}`,
      source: "meta",
      medium: event.channel,
      entity_type: "marketing_conversation",
      entity_id: String(conversationId),
      metadata: {
        external_event_id: event.externalEventId,
        external_message_id: event.externalMessageId,
      },
      occurred_at: event.occurredAt ?? new Date().toISOString(),
    });

    const candidate = buildMetaInboundTaskCandidate(event);
    await db.from("marketing_tasks").insert({
      agent_id: candidate.agentId,
      task_type: candidate.taskType,
      title: candidate.title,
      objective: candidate.objective,
      priority: "normal",
      status: "queued",
      channel: candidate.channel,
      source: "meta_webhook",
      input: {
        conversation_id: conversationId,
        external_message_id: event.externalMessageId,
        event_type: event.eventType,
      },
      approval_level: candidate.approvalLevel,
      approval_status: "not_required",
      conversation_id: conversationId,
      idempotency_key: `meta-inbound-${event.channel}-${event.externalMessageId}`,
      metadata: { outbound_allowed: false },
    });
  }
}

export function normalizeMetaInbound(payload: unknown) {
  return normalizeMetaWebhookPayload(payload);
}

async function defaultMetaStatus(): Promise<MarketingChannelStatus> {
  const db = createAdminClient();
  const { data } = await db.from("marketing_integrations").select("status").eq("provider", "meta").maybeSingle();
  return (data?.status as MarketingChannelStatus | undefined) ?? "setup_required";
}

export const metaServerAdapter: MarketingChannelAdapter = {
  provider: "meta",
  capabilities: ["comments", "messages", "webhooks"],
  getStatus: defaultMetaStatus,
  verifyWebhook: verifyMetaWebhookPost,
  async sendMessage() {
    return {
      ok: false,
      errorCode: "META_OUTBOUND_NOT_ENABLED",
      errorMessage: "Meta outbound replies are not enabled. A governed approval/channel-job executor is required first.",
    };
  },
};

export function metaCredentialRefsForDocumentation() {
  const config = getMetaInfisicalConfig();
  return {
    facebookUser: buildMetaCredentialRef(config, META_SECRET_NAMES.facebookLongLivedUserToken),
    facebookPages: buildMetaCredentialRef(config, META_SECRET_NAMES.facebookPageTokens),
    instagram: buildMetaCredentialRef(config, META_SECRET_NAMES.instagramLongLivedToken),
  };
}
