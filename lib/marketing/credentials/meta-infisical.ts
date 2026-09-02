const DEFAULT_INFISICAL_SITE_URL = "https://app.infisical.com";

export const META_SECRET_NAMES = {
  appId: "META_APP_ID",
  appSecret: "META_APP_SECRET",
  webhookVerifyToken: "META_WEBHOOK_VERIFY_TOKEN",
  facebookLongLivedUserToken: "META_LONG_LIVED_USER_ACCESS_TOKEN",
  facebookPageTokens: "META_PAGE_ACCESS_TOKENS_JSON",
  instagramLongLivedToken: "META_INSTAGRAM_LONG_LIVED_ACCESS_TOKEN",
  whatsappAccessToken: "META_WHATSAPP_ACCESS_TOKEN",
} as const;

type FetchLike = typeof fetch;

export type MetaInfisicalConfig = {
  siteUrl: string;
  clientId: string;
  clientSecret: string;
  projectId: string;
  environment: string;
  secretPath: string;
};

type InfisicalAuthResponse = {
  accessToken?: string;
};

type InfisicalSecretResponse = {
  secret?: {
    secretKey?: string;
    secretValue?: string;
  };
};

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

function normalizeSecretPath(value: string) {
  const normalized = value.trim();
  if (!normalized || normalized === "/") return "/";
  return `/${normalized.replace(/^\/+|\/+$/g, "")}`;
}

function normalizeSiteUrl(value: string) {
  const trimmed = value.trim().replace(/\/+$/, "");
  const parsed = new URL(trimmed);
  if (parsed.protocol !== "https:" && process.env.NODE_ENV === "production") {
    throw new Error("INFISICAL_SITE_URL must use HTTPS in production.");
  }
  return trimmed;
}

export function getMetaInfisicalConfig(): MetaInfisicalConfig {
  return {
    siteUrl: normalizeSiteUrl(process.env.INFISICAL_SITE_URL?.trim() || DEFAULT_INFISICAL_SITE_URL),
    clientId: requiredEnv("INFISICAL_CLIENT_ID"),
    clientSecret: requiredEnv("INFISICAL_CLIENT_SECRET"),
    projectId: requiredEnv("INFISICAL_PROJECT_ID"),
    environment: requiredEnv("INFISICAL_ENVIRONMENT"),
    secretPath: normalizeSecretPath(requiredEnv("INFISICAL_META_SECRET_PATH")),
  };
}

export function buildMetaCredentialRef(config: MetaInfisicalConfig, secretName: string) {
  const path = config.secretPath === "/" ? "" : config.secretPath.replace(/^\//, "");
  return `infisical://${config.environment}/${path ? `${path}/` : ""}${secretName}`;
}

export function sanitizeMetaInfisicalError(_error: unknown) {
  return "Infisical Meta credential operation failed.";
}

async function getAccessToken(config: MetaInfisicalConfig, fetchImpl: FetchLike) {
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
  const payload = await response.json().catch(() => ({})) as InfisicalAuthResponse;
  if (!response.ok || !payload.accessToken) throw new Error("Infisical Universal Auth failed.");
  return payload.accessToken;
}

function secretUrl(config: MetaInfisicalConfig, secretName: string) {
  return `${config.siteUrl}/api/v4/secrets/${encodeURIComponent(secretName)}`;
}

function secretQuery(config: MetaInfisicalConfig) {
  return new URLSearchParams({
    projectId: config.projectId,
    environment: config.environment,
    secretPath: config.secretPath,
    type: "shared",
    viewSecretValue: "true",
    expandSecretReferences: "false",
  }).toString();
}

function deleteSecretQuery(config: MetaInfisicalConfig) {
  return new URLSearchParams({
    projectId: config.projectId,
    environment: config.environment,
    secretPath: config.secretPath,
    type: "shared",
  }).toString();
}

async function readWithToken({
  config,
  fetchImpl,
  accessToken,
  secretName,
}: {
  config: MetaInfisicalConfig;
  fetchImpl: FetchLike;
  accessToken: string;
  secretName: string;
}) {
  const response = await fetchImpl(`${secretUrl(config, secretName)}?${secretQuery(config)}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({})) as InfisicalSecretResponse;
  const value = payload.secret?.secretValue?.trim();
  if (!response.ok || !value) throw new Error(`Infisical secret ${secretName} is unavailable.`);
  return value;
}

export async function readMetaSecrets(
  secretNames: string[],
  {
    config = getMetaInfisicalConfig(),
    fetchImpl = fetch,
  }: { config?: MetaInfisicalConfig; fetchImpl?: FetchLike } = {},
) {
  const accessToken = await getAccessToken(config, fetchImpl);
  const values = await Promise.all(secretNames.map((secretName) => readWithToken({
    config,
    fetchImpl,
    accessToken,
    secretName,
  })));
  return Object.fromEntries(secretNames.map((secretName, index) => [secretName, values[index]])) as Record<string, string>;
}

export async function writeMetaSecret({
  secretName,
  secretValue,
  config = getMetaInfisicalConfig(),
  fetchImpl = fetch,
}: {
  secretName: string;
  secretValue: string;
  config?: MetaInfisicalConfig;
  fetchImpl?: FetchLike;
}) {
  const value = secretValue.trim();
  if (!value) throw new Error("Meta secret value is empty.");
  const accessToken = await getAccessToken(config, fetchImpl);
  const body = {
    projectId: config.projectId,
    environment: config.environment,
    secretValue: value,
    secretPath: config.secretPath,
    type: "shared",
  };
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const updateResponse = await fetchImpl(secretUrl(config, secretName), {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!updateResponse.ok && updateResponse.status !== 404) {
    throw new Error("Meta credential could not be stored securely.");
  }
  if (updateResponse.status === 404) {
    const createResponse = await fetchImpl(secretUrl(config, secretName), {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (!createResponse.ok) throw new Error("Meta credential could not be stored securely.");
  }
  return { credentialRef: buildMetaCredentialRef(config, secretName) };
}

export async function deleteMetaSecret({
  secretName,
  config = getMetaInfisicalConfig(),
  fetchImpl = fetch,
}: {
  secretName: string;
  config?: MetaInfisicalConfig;
  fetchImpl?: FetchLike;
}) {
  const accessToken = await getAccessToken(config, fetchImpl);
  const response = await fetchImpl(`${secretUrl(config, secretName)}?${deleteSecretQuery(config)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!response.ok && response.status !== 404) {
    throw new Error("Meta credential could not be removed securely.");
  }
  return { deleted: response.status !== 404 };
}
