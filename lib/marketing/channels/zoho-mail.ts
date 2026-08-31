import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildZohoCredentialRef,
  getGcpSecretManagerConfig,
  readZohoRefreshTokenSecret,
  writeZohoRefreshTokenSecret,
} from "@/lib/marketing/credentials/gcp-secret-manager";

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

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

export function getZohoMailRuntimeConfig(): ZohoMailRuntimeConfig {
  return {
    accountsBaseUrl: normalizeZohoBaseUrl(requiredEnv("ZOHO_ACCOUNTS_BASE_URL"), "ZOHO_ACCOUNTS_BASE_URL"),
    apiBaseUrl: normalizeZohoBaseUrl(requiredEnv("ZOHO_MAIL_API_BASE_URL"), "ZOHO_MAIL_API_BASE_URL"),
    clientId: requiredEnv("ZOHO_MAIL_CLIENT_ID"),
    clientSecret: requiredEnv("ZOHO_MAIL_CLIENT_SECRET"),
    redirectUri: requiredEnv("ZOHO_MAIL_REDIRECT_URI"),
  };
}

export async function persistZohoAccountVerification({
  accountId,
  config = getZohoMailRuntimeConfig(),
  refreshTokenReceived,
}: {
  accountId: string;
  config?: ZohoMailRuntimeConfig;
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
  config = getZohoMailRuntimeConfig(),
}: {
  accountId: string;
  credentialRef: string;
  config?: ZohoMailRuntimeConfig;
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
    credential_store: "gcp_secret_manager",
    token_storage: "gcp_secret_manager",
  };
  const { error } = await db.from("marketing_integrations").upsert({
    provider: "email",
    status: "connected",
    capabilities: { send: true, receive: false, tracking: false },
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
  const gcpConfig = getGcpSecretManagerConfig();
  const stored = await writeZohoRefreshTokenSecret({ refreshToken, config: gcpConfig });
  if (stored.credentialRef !== buildZohoCredentialRef(gcpConfig)) {
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

async function defaultConnectionState(): Promise<ZohoConnectionState> {
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

async function getDurableZohoAccessToken(): Promise<string> {
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
      config: getZohoMailRuntimeConfig(),
    });
    return tokenSet.accessToken;
  } catch (error) {
    await persistZohoConnectionError(error);
    throw error;
  }
}

export const zohoMailServerAdapter = createZohoMailAdapter({
  getAccessToken: getDurableZohoAccessToken,
  getConnectionState: defaultConnectionState,
});
