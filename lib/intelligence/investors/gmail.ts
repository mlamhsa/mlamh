import { createHash, randomBytes } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  readInvestorGmailClientCredentials,
  readInvestorGmailRefreshToken,
  storeInvestorGmailRefreshToken,
} from "./credentials";

export const INVESTOR_GMAIL_PROVIDER = "investor_gmail";
export const INVESTOR_GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
] as const;

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_API_BASE_URL = "https://gmail.googleapis.com/gmail/v1";
const DEFAULT_REDIRECT_URI = "https://mlamh.net/api/admin/investors/integrations/gmail/callback";

type FetchLike = typeof fetch;

type GoogleTokenPayload = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

type GmailProfile = {
  emailAddress?: string;
  messagesTotal?: number;
  threadsTotal?: number;
};

type GmailHeader = {
  name?: string;
  value?: string;
};

type GmailMessagePart = {
  mimeType?: string;
  filename?: string;
  headers?: GmailHeader[];
  body?: { data?: string; size?: number };
  parts?: GmailMessagePart[];
};

type GmailMessage = {
  id?: string;
  threadId?: string;
  labelIds?: string[];
  snippet?: string;
  internalDate?: string;
  payload?: GmailMessagePart;
};

type GmailThread = {
  id?: string;
  messages?: GmailMessage[];
};

export type InvestorGmailConnectionState = {
  status: "connected" | "setup_required" | "connecting" | "error" | "paused" | "limited";
  emailAddress: string | null;
  credentialRef: string | null;
  connectedAt: string | null;
  lastSyncAt: string | null;
};

export type InvestorGmailIncomingMessage = {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  messageIdHeader: string | null;
  text: string;
  internalDate: string | null;
};

function redirectUri() {
  return process.env.INVESTOR_GMAIL_REDIRECT_URI?.trim() || DEFAULT_REDIRECT_URI;
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function encodeHeader(value: string) {
  return /^[\x00-\x7F]*$/.test(value)
    ? value
    : `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

function headerValue(headers: GmailHeader[] | undefined, name: string) {
  const target = name.toLowerCase();
  return headers?.find((header) => header.name?.toLowerCase() === target)?.value?.trim() || "";
}

function plainTextFromPart(part: GmailMessagePart | undefined): string {
  if (!part) return "";
  if (part.mimeType === "text/plain" && part.body?.data) {
    return base64UrlDecode(part.body.data);
  }
  for (const child of part.parts ?? []) {
    const text = plainTextFromPart(child);
    if (text.trim()) return text;
  }
  if (part.body?.data && (!part.mimeType || part.mimeType === "text/plain")) {
    return base64UrlDecode(part.body.data);
  }
  return "";
}

function sanitizeProviderError(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error ?? "Investor Gmail request failed.");
  if (/access[_ -]?token|refresh[_ -]?token|client[_ -]?secret|authorization|bearer/i.test(raw)) {
    return "Investor Gmail authentication or configuration failed.";
  }
  return raw.replace(/[\r\n]+/g, " ").slice(0, 500);
}

export async function createInvestorGmailOAuthRequest() {
  const credentials = await readInvestorGmailClientCredentials();
  const state = randomBytes(24).toString("base64url");
  const codeVerifier = randomBytes(48).toString("base64url");
  const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url");
  const url = new URL(GOOGLE_AUTH_URL);
  url.searchParams.set("client_id", credentials.clientId);
  url.searchParams.set("redirect_uri", redirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("scope", INVESTOR_GMAIL_SCOPES.join(" "));
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return { authorizationUrl: url.toString(), state, codeVerifier };
}

export async function exchangeInvestorGmailAuthorizationCode({
  code,
  codeVerifier,
  fetchImpl = fetch,
}: {
  code: string;
  codeVerifier: string;
  fetchImpl?: FetchLike;
}) {
  const credentials = await readInvestorGmailClientCredentials();
  const body = new URLSearchParams({
    code,
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    redirect_uri: redirectUri(),
    grant_type: "authorization_code",
    code_verifier: codeVerifier,
  });
  const response = await fetchImpl(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => ({}))) as GoogleTokenPayload;
  if (!response.ok || !payload.access_token || payload.error) {
    throw new Error(payload.error_description || "Investor Gmail OAuth token exchange failed.");
  }
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? null,
    expiresIn: payload.expires_in ?? null,
    scope: payload.scope ?? null,
  };
}

async function getGmailProfile(accessToken: string, fetchImpl: FetchLike = fetch) {
  const response = await fetchImpl(`${GMAIL_API_BASE_URL}/users/me/profile`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => ({}))) as GmailProfile;
  if (!response.ok || !payload.emailAddress) {
    throw new Error("Investor Gmail profile verification failed.");
  }
  return { emailAddress: payload.emailAddress.trim().toLowerCase() };
}

export async function persistInvestorGmailConnection({
  accessToken,
  refreshToken,
}: {
  accessToken: string;
  refreshToken: string | null;
}) {
  const db = createAdminClient();
  const profile = await getGmailProfile(accessToken);
  let credentialRef: string | null = null;

  if (refreshToken) {
    const stored = await storeInvestorGmailRefreshToken(refreshToken);
    credentialRef = stored.credentialRef;
  } else {
    const existing = await getInvestorGmailConnectionState();
    credentialRef = existing.credentialRef;
  }

  if (!credentialRef) {
    throw new Error("Google did not return a refresh token. Reconnect Gmail and grant offline access.");
  }

  const now = new Date().toISOString();
  const { error } = await db.from("marketing_integrations").upsert(
    {
      provider: INVESTOR_GMAIL_PROVIDER,
      status: "connected",
      capabilities: { send: true, read: true, threading: true },
      configuration_state: {
        email_address: profile.emailAddress,
        credential_ref: credentialRef,
        credential_store: "infisical",
        scopes: [...INVESTOR_GMAIL_SCOPES],
        redirect_uri: redirectUri(),
        connected_at: now,
      },
      last_sync_at: now,
      last_success_at: now,
      last_error: null,
      metadata: { purpose: "investor_relations", technical_provider: "gmail" },
      updated_at: now,
    },
    { onConflict: "provider" },
  );
  if (error) throw new Error("Investor Gmail connection could not be persisted.");
  return profile;
}

export async function persistInvestorGmailError(error: unknown) {
  const db = createAdminClient();
  const now = new Date().toISOString();
  await db.from("marketing_integrations").upsert(
    {
      provider: INVESTOR_GMAIL_PROVIDER,
      status: "error",
      last_sync_at: now,
      last_error: sanitizeProviderError(error),
      metadata: { purpose: "investor_relations", technical_provider: "gmail" },
      updated_at: now,
    },
    { onConflict: "provider" },
  );
}

export async function getInvestorGmailConnectionState(): Promise<InvestorGmailConnectionState> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("marketing_integrations")
    .select("status,configuration_state,last_sync_at")
    .eq("provider", INVESTOR_GMAIL_PROVIDER)
    .maybeSingle();

  if (error || !data) {
    return { status: "setup_required", emailAddress: null, credentialRef: null, connectedAt: null, lastSyncAt: null };
  }

  const state = data.configuration_state && typeof data.configuration_state === "object" && !Array.isArray(data.configuration_state)
    ? (data.configuration_state as Record<string, unknown>)
    : {};
  return {
    status: data.status as InvestorGmailConnectionState["status"],
    emailAddress: typeof state.email_address === "string" ? state.email_address : null,
    credentialRef: typeof state.credential_ref === "string" ? state.credential_ref : null,
    connectedAt: typeof state.connected_at === "string" ? state.connected_at : null,
    lastSyncAt: typeof data.last_sync_at === "string" ? data.last_sync_at : null,
  };
}

export async function getInvestorGmailAccessToken(fetchImpl: FetchLike = fetch) {
  try {
    const state = await getInvestorGmailConnectionState();
    if (!state.credentialRef) throw new Error("Investor Gmail is not connected.");
    const refreshToken = await readInvestorGmailRefreshToken({ credentialRef: state.credentialRef });
    const credentials = await readInvestorGmailClientCredentials();
    const response = await fetchImpl(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
      cache: "no-store",
    });
    const payload = (await response.json().catch(() => ({}))) as GoogleTokenPayload;
    if (!response.ok || !payload.access_token || payload.error) {
      throw new Error(payload.error_description || "Investor Gmail access token refresh failed.");
    }
    return payload.access_token;
  } catch (error) {
    await persistInvestorGmailError(error);
    throw error;
  }
}

function buildRawMessage({
  from,
  to,
  subject,
  bodyText,
  inReplyTo,
  references,
}: {
  from: string;
  to: string;
  subject: string;
  bodyText: string;
  inReplyTo?: string | null;
  references?: string | null;
}) {
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodeHeader(subject)}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
  ];
  if (inReplyTo) headers.push(`In-Reply-To: ${inReplyTo}`);
  if (references) headers.push(`References: ${references}`);
  return base64UrlEncode(`${headers.join("\r\n")}\r\n\r\n${bodyText}`);
}

async function getThreadReplyHeaders(threadId: string, accessToken: string, fetchImpl: FetchLike) {
  const url = new URL(`${GMAIL_API_BASE_URL}/users/me/threads/${encodeURIComponent(threadId)}`);
  url.searchParams.set("format", "metadata");
  url.searchParams.append("metadataHeaders", "Message-ID");
  url.searchParams.append("metadataHeaders", "References");
  const response = await fetchImpl(url, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => ({}))) as GmailThread;
  if (!response.ok) throw new Error("Investor Gmail thread could not be read.");
  const last = payload.messages?.at(-1);
  const messageId = headerValue(last?.payload?.headers, "Message-ID") || null;
  const references = headerValue(last?.payload?.headers, "References") || messageId;
  return { messageId, references };
}

export async function sendInvestorGmailMessage({
  to,
  subject,
  bodyText,
  threadId,
  fetchImpl = fetch,
}: {
  to: string;
  subject: string;
  bodyText: string;
  threadId?: string | null;
  fetchImpl?: FetchLike;
}) {
  const connection = await getInvestorGmailConnectionState();
  if (connection.status !== "connected" || !connection.emailAddress) {
    throw new Error("Investor Gmail is not connected.");
  }
  const accessToken = await getInvestorGmailAccessToken(fetchImpl);
  const replyHeaders = threadId
    ? await getThreadReplyHeaders(threadId, accessToken, fetchImpl)
    : { messageId: null, references: null };
  const raw = buildRawMessage({
    from: connection.emailAddress,
    to,
    subject,
    bodyText,
    inReplyTo: replyHeaders.messageId,
    references: replyHeaders.references,
  });
  const response = await fetchImpl(`${GMAIL_API_BASE_URL}/users/me/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ raw, ...(threadId ? { threadId } : {}) }),
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => ({}))) as GmailMessage;
  if (!response.ok || !payload.id || !payload.threadId) {
    throw new Error(`Investor Gmail send failed with status ${response.status}.`);
  }
  return { messageId: payload.id, threadId: payload.threadId };
}

export async function readInvestorGmailThread(threadId: string, fetchImpl: FetchLike = fetch) {
  const connection = await getInvestorGmailConnectionState();
  if (connection.status !== "connected" || !connection.emailAddress) {
    throw new Error("Investor Gmail is not connected.");
  }
  const accessToken = await getInvestorGmailAccessToken(fetchImpl);
  const response = await fetchImpl(`${GMAIL_API_BASE_URL}/users/me/threads/${encodeURIComponent(threadId)}?format=full`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => ({}))) as GmailThread;
  if (!response.ok || !payload.id) throw new Error("Investor Gmail thread could not be read.");

  const account = connection.emailAddress.toLowerCase();
  const messages: InvestorGmailIncomingMessage[] = [];
  for (const message of payload.messages ?? []) {
    if (!message.id || !message.threadId) continue;
    const from = headerValue(message.payload?.headers, "From");
    if (from.toLowerCase().includes(account)) continue;
    messages.push({
      id: message.id,
      threadId: message.threadId,
      from,
      to: headerValue(message.payload?.headers, "To"),
      subject: headerValue(message.payload?.headers, "Subject"),
      messageIdHeader: headerValue(message.payload?.headers, "Message-ID") || null,
      text: plainTextFromPart(message.payload).trim() || message.snippet?.trim() || "",
      internalDate: message.internalDate ? new Date(Number(message.internalDate)).toISOString() : null,
    });
  }
  return messages;
}
