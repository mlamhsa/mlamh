import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildZohoCredentialRef,
  getInfisicalConfig,
  readZohoClientCredentials,
  readZohoRefreshTokenSecret,
  writeZohoRefreshTokenSecret,
} from "@/lib/marketing/credentials/infisical";

import type { MarketingChannelStatus } from "./types";
import {
  MLAMH_ZOHO_MAIL_ADDRESS,
  ZOHO_MAIL_PHASE1_SCOPES,
  createZohoMailAdapter,
  exchangeZohoRefreshToken,
  normalizeZohoBaseUrl,
  sanitizeZohoError,
  type ZohoConnectionState,
  type ZohoMailRuntimeConfig,
} from "./zoho-mail-core";

export {
  MLAMH_ZOHO_MAIL_ADDRESS,
  ZOHO_MAIL_PHASE1_SCOPES,
  createZohoMailAdapter,
  createZohoOAuthRequest,
  exchangeZohoAuthorizationCode,
  exchangeZohoRefreshToken,
  sanitizeZohoError,
  verifyZohoMailAccount,
  type ZohoMailRuntimeConfig,
  type ZohoOAuthRequest,
} from "./zoho-mail-core";

const APPROVED_ZOHO_REDIRECT_URI = "https://mlamh.net/api/marketing/integrations/zoho/callback";

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

export async function getZohoMailRuntimeConfig(): Promise<ZohoMailRuntimeConfig> {
  const credentials = await readZohoClientCredentials();
  return {
    accountsBaseUrl: normalizeZohoBaseUrl(requiredEnv("ZOHO_ACCOUNTS_BASE_URL"), "ZOHO_ACCOUNTS_BASE_URL"),
    apiBaseUrl: normalizeZohoBaseUrl(requiredEnv("ZOHO_MAIL_API_BASE_URL"), "ZOHO_MAIL_API_BASE_URL"),
    clientId: credentials.clientId,
    clientSecret: credentials.clientSecret,
    redirectUri: process.env.ZOHO_MAIL_REDIRECT_URI?.trim() || APPROVED_ZOHO_REDIRECT_URI,
  };
}

export async function persistZohoAccountVerification({
  accountId,
  config,
  refreshTokenReceived,
}: {
  accountId: string;
  config: ZohoMailRuntimeConfig;
  refreshTokenReceived: boolean;
}) {
  const db = createAdminClient();
  const now = new Date().toISOString();
  const configurationState = {
    technical_provider: "zoho_mail",
    account_id: accountId,
    verified_address: MLAMH_ZOHO_MAIL_ADDRESS,
    accounts_base_url: config.accountsBaseUrl,
    api_base_url: config.apiBaseUrl,
    oauth_verified_at: now,
    oauth_scopes: [...ZOHO_MAIL_PHASE1_SCOPES],
    refresh_token_received: refreshTokenReceived,
    token_storage: "pending_secure_store",
  };
  const { error } = await db.from("marketing_integrations").upsert({
    provider: "email",
    status: "limited",
    capabilities: { send: false, receive: false, tracking: false },
    configuration_state: configurationState,
    last_sync_at: now,
    last_success_at: now,
    last_error: null,
    metadata: { technical_provider: "zoho_mail" },
    updated_at: now,
  }, { onConflict: "provider" });
  if (error) throw new Error("Zoho Mail verification could not be persisted.");
  return configurationState;
}

export async function persistZohoDurableConnection({
  accountId,
  credentialRef,
  config,
}: {
  accountId: string;
  credentialRef: string;
  config: ZohoMailRuntimeConfig;
}) {
  const db = createAdminClient();
  const now = new Date().toISOString();
  const configurationState = {
    technical_provider: "zoho_mail",
    account_id: accountId,
    verified_address: MLAMH_ZOHO_MAIL_ADDRESS,
    accounts_base_url: config.accountsBaseUrl,
    api_base_url: config.apiBaseUrl,
    oauth_verified_at: now,
    oauth_scopes: [...ZOHO_MAIL_PHASE1_SCOPES],
    credential_ref: credentialRef,
    credential_store: "infisical",
    token_storage: "infisical",
  };
  const { error } = await db.from("marketing_integrations").upsert({
    provider: "email",
    status: "connected",
    capabilities: { send: true, receive: true, tracking: false },
    configuration_state: configurationState,
    last_sync_at: now,
    last_success_at: now,
    last_error: null,
    metadata: { technical_provider: "zoho_mail" },
    updated_at: now,
  }, { onConflict: "provider" });
  if (error) throw new Error("Zoho Mail durable connection could not be persisted.");
  return configurationState;
}

export async function storeZohoRefreshToken(refreshToken: string) {
  const infisicalConfig = getInfisicalConfig();
  const stored = await writeZohoRefreshTokenSecret({ refreshToken, config: infisicalConfig });
  if (stored.credentialRef !== buildZohoCredentialRef(infisicalConfig)) {
    throw new Error("Zoho credential reference verification failed.");
  }
  return stored;
}

export async function persistZohoConnectionError(error: unknown) {
  const db = createAdminClient();
  const now = new Date().toISOString();
  await db.from("marketing_integrations").upsert({
    provider: "email",
    status: "error",
    last_sync_at: now,
    last_error: sanitizeZohoError(error),
    metadata: { technical_provider: "zoho_mail" },
    updated_at: now,
  }, { onConflict: "provider" });
}

export async function getZohoMailConnectionState(): Promise<ZohoConnectionState> {
  const db = createAdminClient();
  const { data, error } = await db.from("marketing_integrations")
    .select("status,configuration_state")
    .eq("provider", "email")
    .maybeSingle();
  if (error || !data) return { status: "setup_required", accountId: null, fromAddress: MLAMH_ZOHO_MAIL_ADDRESS, apiBaseUrl: "" };
  const state = data.configuration_state && typeof data.configuration_state === "object" && !Array.isArray(data.configuration_state)
    ? data.configuration_state as Record<string, unknown>
    : {};
  return {
    status: data.status as MarketingChannelStatus,
    accountId: typeof state.account_id === "string" ? state.account_id : null,
    fromAddress: typeof state.verified_address === "string" ? state.verified_address : MLAMH_ZOHO_MAIL_ADDRESS,
    apiBaseUrl: typeof state.api_base_url === "string" ? state.api_base_url : "",
  };
}

export async function getZohoDurableAccessToken(): Promise<string> {
  try {
    const db = createAdminClient();
    const { data, error } = await db.from("marketing_integrations")
      .select("status,configuration_state")
      .eq("provider", "email")
      .maybeSingle();
    if (error || !data || data.status !== "connected") throw new Error("Zoho Mail durable connection is not active.");
    const state = data.configuration_state && typeof data.configuration_state === "object" && !Array.isArray(data.configuration_state)
      ? data.configuration_state as Record<string, unknown>
      : {};
    const credentialRef = typeof state.credential_ref === "string" ? state.credential_ref : "";
    if (!credentialRef) throw new Error("Zoho credential reference is missing.");
    const refreshToken = await readZohoRefreshTokenSecret({ credentialRef });
    const tokenSet = await exchangeZohoRefreshToken({
      refreshToken,
      config: await getZohoMailRuntimeConfig(),
    });
    return tokenSet.accessToken;
  } catch (error) {
    await persistZohoConnectionError(error);
    throw error;
  }
}

export const zohoMailServerAdapter = createZohoMailAdapter({
  getAccessToken: getZohoDurableAccessToken,
  getConnectionState: getZohoMailConnectionState,
});
