import { createHash, randomBytes } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";

import type {
  MarketingChannelAdapter,
  MarketingChannelStatus,
  MarketingMessageInput,
  MarketingMessageResult,
} from "./types";

export const MLAMH_ZOHO_MAIL_ADDRESS = "hello@mlamh.net";
export const ZOHO_MAIL_PHASE1_SCOPES = [
  "ZohoMail.accounts.READ",
  "ZohoMail.messages.CREATE",
] as const;

export type ZohoMailRuntimeConfig = {
  accountsBaseUrl: string;
  apiBaseUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

export type ZohoOAuthRequest = {
  authorizationUrl: string;
  state: string;
  codeVerifier: string;
};

type ZohoTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  api_domain?: string;
  token_type?: string;
  error?: string;
};

type ZohoAccount = {
  accountId?: string | number;
  primaryEmailAddress?: string;
  mailboxAddress?: string;
  emailAddress?: Array<{ mailId?: string; isPrimary?: boolean; isConfirmed?: boolean }>;
};

type ZohoAccountsResponse = {
  status?: { code?: number; description?: string };
  data?: ZohoAccount[];
};

type ZohoSendResponse = {
  status?: { code?: number; description?: string };
  data?: {
    messageId?: string | number;
    mailId?: string;
    subject?: string;
    fromAddress?: string;
    toAddress?: string;
  };
};

type ZohoConnectionState = {
  status: MarketingChannelStatus;
  accountId: string | null;
  fromAddress: string;
  apiBaseUrl: string;
};

type ZohoMailAdapterDependencies = {
  fetchImpl?: typeof fetch;
  getAccessToken?: () => Promise<string>;
  getConnectionState?: () => Promise<ZohoConnectionState>;
};

function normalizeBaseUrl(value: string, name: string) {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) throw new Error(`${name} is not configured.`);
  const parsed = new URL(trimmed);
  if (parsed.protocol !== "https:" && process.env.NODE_ENV === "production") {
    throw new Error(`${name} must use HTTPS in production.`);
  }
  return trimmed;
}

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

export function getZohoMailRuntimeConfig(): ZohoMailRuntimeConfig {
  return {
    accountsBaseUrl: normalizeBaseUrl(requiredEnv("ZOHO_ACCOUNTS_BASE_URL"), "ZOHO_ACCOUNTS_BASE_URL"),
    apiBaseUrl: normalizeBaseUrl(requiredEnv("ZOHO_MAIL_API_BASE_URL"), "ZOHO_MAIL_API_BASE_URL"),
    clientId: requiredEnv("ZOHO_MAIL_CLIENT_ID"),
    clientSecret: requiredEnv("ZOHO_MAIL_CLIENT_SECRET"),
    redirectUri: requiredEnv("ZOHO_MAIL_REDIRECT_URI"),
  };
}

export function sanitizeZohoError(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error ?? "Zoho Mail request failed.");
  if (/access[_ -]?token|refresh[_ -]?token|client[_ -]?secret|authorization|bearer|zoho-oauthtoken/i.test(raw)) {
    return "Zoho Mail authentication or configuration failed.";
  }
  return raw.replace(/[\r\n]+/g, " ").slice(0, 500);
}

export function createZohoOAuthRequest(config: ZohoMailRuntimeConfig = getZohoMailRuntimeConfig()): ZohoOAuthRequest {
  const state = randomBytes(24).toString("base64url");
  const codeVerifier = randomBytes(48).toString("base64url");
  const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url");
  const url = new URL(`${normalizeBaseUrl(config.accountsBaseUrl, "Zoho Accounts base URL")}/oauth/v2/auth`);
  url.searchParams.set("scope", ZOHO_MAIL_PHASE1_SCOPES.join(","));
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return { authorizationUrl: url.toString(), state, codeVerifier };
}

export async function exchangeZohoAuthorizationCode({
  code,
  codeVerifier,
  config = getZohoMailRuntimeConfig(),
  fetchImpl = fetch,
}: {
  code: string;
  codeVerifier: string;
  config?: ZohoMailRuntimeConfig;
  fetchImpl?: typeof fetch;
}) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    code,
    code_verifier: codeVerifier,
  });
  const response = await fetchImpl(`${normalizeBaseUrl(config.accountsBaseUrl, "Zoho Accounts base URL")}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({})) as ZohoTokenResponse;
  if (!response.ok || !payload.access_token || payload.error) {
    throw new Error("Zoho OAuth token exchange failed.");
  }
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? null,
    expiresIn: payload.expires_in ?? null,
    apiDomain: payload.api_domain ?? null,
  };
}

function accountAddresses(account: ZohoAccount) {
  return [
    account.primaryEmailAddress,
    account.mailboxAddress,
    ...(account.emailAddress ?? []).map((item) => item.mailId),
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim().toLowerCase());
}

export async function verifyZohoMailAccount({
  accessToken,
  config = getZohoMailRuntimeConfig(),
  fetchImpl = fetch,
}: {
  accessToken: string;
  config?: ZohoMailRuntimeConfig;
  fetchImpl?: typeof fetch;
}) {
  const response = await fetchImpl(`${normalizeBaseUrl(config.apiBaseUrl, "Zoho Mail API base URL")}/api/accounts`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Zoho-oauthtoken ${accessToken}`,
    },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({})) as ZohoAccountsResponse;
  if (!response.ok || payload.status?.code !== 200 || !Array.isArray(payload.data)) {
    throw new Error("Zoho Mail account verification failed.");
  }
  const expected = MLAMH_ZOHO_MAIL_ADDRESS.toLowerCase();
  const account = payload.data.find((item) => accountAddresses(item).includes(expected));
  if (!account?.accountId) throw new Error(`Authorized Zoho account does not include ${MLAMH_ZOHO_MAIL_ADDRESS}.`);
  return {
    accountId: String(account.accountId),
    address: MLAMH_ZOHO_MAIL_ADDRESS,
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

async function durableAccessTokenNotConfigured(): Promise<string> {
  throw new Error("Zoho durable OAuth token storage is not configured.");
}

export function createZohoMailAdapter(dependencies: ZohoMailAdapterDependencies = {}): MarketingChannelAdapter {
  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const getAccessToken = dependencies.getAccessToken ?? durableAccessTokenNotConfigured;
  const getConnectionState = dependencies.getConnectionState ?? defaultConnectionState;

  return {
    provider: "email",
    capabilities: ["messages", "delivery_status"],
    async getStatus() {
      return (await getConnectionState()).status;
    },
    async sendMessage(input: MarketingMessageInput): Promise<MarketingMessageResult> {
      try {
        const connection = await getConnectionState();
        if (connection.status !== "connected") {
          return { ok: false, errorCode: "ZOHO_NOT_CONNECTED", errorMessage: "Zoho Mail is not connected for durable sending." };
        }
        if (!connection.accountId || !connection.apiBaseUrl) {
          return { ok: false, errorCode: "ZOHO_ACCOUNT_NOT_CONFIGURED", errorMessage: "Zoho Mail account configuration is incomplete." };
        }
        const recipient = typeof input.recipient.email === "string" ? input.recipient.email.trim() : "";
        if (!recipient || !recipient.includes("@")) {
          return { ok: false, errorCode: "INVALID_RECIPIENT", errorMessage: "A valid email recipient is required." };
        }
        const subject = typeof input.metadata?.subject === "string" ? input.metadata.subject.trim() : "";
        if (!subject) return { ok: false, errorCode: "MISSING_SUBJECT", errorMessage: "Email subject is required." };
        const accessToken = await getAccessToken();
        const response = await fetchImpl(`${normalizeBaseUrl(connection.apiBaseUrl, "Zoho Mail API base URL")}/api/accounts/${encodeURIComponent(connection.accountId)}/messages`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Zoho-oauthtoken ${accessToken}`,
          },
          body: JSON.stringify({
            fromAddress: connection.fromAddress,
            toAddress: recipient,
            subject,
            content: input.text,
            mailFormat: "plaintext",
          }),
          cache: "no-store",
        });
        const payload = await response.json().catch(() => ({})) as ZohoSendResponse;
        const messageId = payload.data?.messageId;
        if (!response.ok || payload.status?.code !== 200 || messageId === undefined || messageId === null) {
          return { ok: false, errorCode: "ZOHO_SEND_FAILED", errorMessage: "Zoho Mail send request failed." };
        }
        return {
          ok: true,
          externalId: String(messageId),
          metadata: {
            provider: "zoho_mail",
            external_message_id: String(messageId),
            mail_id: payload.data?.mailId ?? null,
          },
        };
      } catch (error) {
        return { ok: false, errorCode: "ZOHO_SEND_FAILED", errorMessage: sanitizeZohoError(error) };
      }
    },
  };
}

export const zohoMailServerAdapter = createZohoMailAdapter();
