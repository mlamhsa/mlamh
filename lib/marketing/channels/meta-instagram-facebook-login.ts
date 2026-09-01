import { randomBytes } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  META_SECRET_NAMES,
  getMetaInfisicalConfig,
  writeMetaSecret,
} from "@/lib/marketing/credentials/meta-infisical";
import { getMetaAppCredentials, getMetaRuntimeConfig } from "./meta";

const INSTAGRAM_FACEBOOK_LOGIN_SCOPES = [
  "instagram_basic",
  "instagram_content_publish",
  "instagram_manage_messages",
  "instagram_manage_insights",
  "pages_read_engagement",
  "pages_show_list",
  "read_insights",
  "business_management",
] as const;

async function graphJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  const payload = await response.json().catch(() => ({})) as T & { error?: unknown };
  if (!response.ok || payload.error) throw new Error("Meta API request failed.");
  return payload;
}

export async function createInstagramFacebookLoginOAuthRequest() {
  const { appId } = await getMetaAppCredentials();
  const config = getMetaRuntimeConfig();
  const state = randomBytes(32).toString("base64url");
  const url = new URL(`https://www.facebook.com/${config.graphVersion}/dialog/oauth`);
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", config.instagramOAuthRedirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", INSTAGRAM_FACEBOOK_LOGIN_SCOPES.join(","));
  return { authorizationUrl: url.toString(), state };
}

export async function completeInstagramFacebookLoginOAuth(code: string) {
  const { appId, appSecret } = await getMetaAppCredentials();
  const config = getMetaRuntimeConfig();

  const tokenUrl = new URL(`${config.graphBaseUrl}/oauth/access_token`);
  tokenUrl.searchParams.set("client_id", appId);
  tokenUrl.searchParams.set("client_secret", appSecret);
  tokenUrl.searchParams.set("redirect_uri", config.instagramOAuthRedirectUri);
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

  const pages = (pagesPayload.data ?? []).filter(
    (page) => page.id && page.access_token && page.instagram_business_account?.id,
  );
  if (pages.length === 0) {
    throw new Error("No Instagram professional account linked to a manageable Facebook Page was returned by Meta.");
  }

  const pageTokens = Object.fromEntries(
    pages.map((page) => [page.id as string, page.access_token as string]),
  );
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
  const facebookPages = pages.map((page) => ({
    id: page.id as string,
    name: page.name ?? null,
    instagramAccountId: page.instagram_business_account?.id ?? null,
    instagramUsername: page.instagram_business_account?.username ?? null,
  }));
  const configurationState = {
    ...previous,
    technical_provider: "meta",
    facebook_pages: facebookPages,
    instagram_login_account_id: facebookPages[0]?.instagramAccountId ?? null,
    credential_refs: {
      ...previousRefs,
      facebook_user: userStored.credentialRef,
      facebook_pages: pagesStored.credentialRef,
    },
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
