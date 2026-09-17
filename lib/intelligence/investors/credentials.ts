import { getInfisicalConfig, type InfisicalConfig } from "@/lib/marketing/credentials/infisical";

const GMAIL_REFRESH_TOKEN_SECRET = "INVESTOR_GMAIL_REFRESH_TOKEN";
const GMAIL_CLIENT_ID_SECRET = "INVESTOR_GMAIL_CLIENT_ID";
const GMAIL_CLIENT_SECRET_SECRET = "INVESTOR_GMAIL_CLIENT_SECRET";

type FetchLike = typeof fetch;

type InfisicalAuthResponse = {
  accessToken?: string;
};

type InfisicalSecretResponse = {
  secret?: {
    secretValue?: string;
  };
};

async function getAccessToken(config: InfisicalConfig, fetchImpl: FetchLike) {
  const body = new URLSearchParams({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
  });
  const response = await fetchImpl(`${config.siteUrl}/api/v1/auth/universal-auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => ({}))) as InfisicalAuthResponse;
  if (!response.ok || !payload.accessToken) {
    throw new Error("Investor Gmail credential store authentication failed.");
  }
  return payload.accessToken;
}

function secretUrl(config: InfisicalConfig, secretName: string) {
  return `${config.siteUrl}/api/v4/secrets/${encodeURIComponent(secretName)}`;
}

function secretQuery(config: InfisicalConfig) {
  return new URLSearchParams({
    projectId: config.projectId,
    environment: config.environment,
    secretPath: config.secretPath,
    type: "shared",
    viewSecretValue: "true",
    expandSecretReferences: "false",
  }).toString();
}

async function readSecret(secretName: string, config: InfisicalConfig, fetchImpl: FetchLike) {
  const accessToken = await getAccessToken(config, fetchImpl);
  const response = await fetchImpl(`${secretUrl(config, secretName)}?${secretQuery(config)}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => ({}))) as InfisicalSecretResponse;
  const value = payload.secret?.secretValue?.trim();
  if (!response.ok || !value) {
    throw new Error(`Investor Gmail secret ${secretName} is unavailable.`);
  }
  return value;
}

async function writeSecret(secretName: string, secretValue: string, config: InfisicalConfig, fetchImpl: FetchLike) {
  const value = secretValue.trim();
  if (!value) throw new Error("Investor Gmail secret value is empty.");

  const accessToken = await getAccessToken(config, fetchImpl);
  const body = {
    projectId: config.projectId,
    environment: config.environment,
    secretValue: value,
    secretPath: config.secretPath,
    type: "shared",
  };
  const url = secretUrl(config, secretName);
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const updateResponse = await fetchImpl(url, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (updateResponse.ok) return;
  if (updateResponse.status !== 404) {
    throw new Error("Investor Gmail credential could not be stored securely.");
  }

  const createResponse = await fetchImpl(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!createResponse.ok) {
    throw new Error("Investor Gmail credential could not be stored securely.");
  }
}

export function buildInvestorGmailCredentialRef(config = getInfisicalConfig()) {
  const path = config.secretPath === "/" ? "" : config.secretPath.replace(/^\//, "");
  return `infisical://${config.environment}/${path ? `${path}/` : ""}${GMAIL_REFRESH_TOKEN_SECRET}`;
}

export async function readInvestorGmailClientCredentials({
  config = getInfisicalConfig(),
  fetchImpl = fetch,
}: {
  config?: InfisicalConfig;
  fetchImpl?: FetchLike;
} = {}) {
  const envClientId = process.env.INVESTOR_GMAIL_CLIENT_ID?.trim();
  const envClientSecret = process.env.INVESTOR_GMAIL_CLIENT_SECRET?.trim();
  if (envClientId && envClientSecret) {
    return { clientId: envClientId, clientSecret: envClientSecret, source: "environment" as const };
  }

  const [clientId, clientSecret] = await Promise.all([
    readSecret(GMAIL_CLIENT_ID_SECRET, config, fetchImpl),
    readSecret(GMAIL_CLIENT_SECRET_SECRET, config, fetchImpl),
  ]);
  return { clientId, clientSecret, source: "infisical" as const };
}

export async function storeInvestorGmailRefreshToken(refreshToken: string) {
  const config = getInfisicalConfig();
  await writeSecret(GMAIL_REFRESH_TOKEN_SECRET, refreshToken, config, fetch);
  return { credentialRef: buildInvestorGmailCredentialRef(config) };
}

export async function readInvestorGmailRefreshToken({ credentialRef }: { credentialRef: string }) {
  const config = getInfisicalConfig();
  if (credentialRef !== buildInvestorGmailCredentialRef(config)) {
    throw new Error("Investor Gmail credential reference is invalid.");
  }
  return readSecret(GMAIL_REFRESH_TOKEN_SECRET, config, fetch);
}
