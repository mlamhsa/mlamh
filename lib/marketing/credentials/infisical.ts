const DEFAULT_INFISICAL_SITE_URL = "https://app.infisical.com";
const ZOHO_REFRESH_TOKEN_SECRET = "ZOHO_REFRESH_TOKEN";
const ZOHO_CLIENT_ID_SECRET = "ZOHO_CLIENT_ID";
const ZOHO_CLIENT_SECRET_SECRET = "ZOHO_CLIENT_SECRET";

type FetchLike = typeof fetch;

export type InfisicalConfig = {
  siteUrl: string;
  clientId: string;
  clientSecret: string;
  projectId: string;
  environment: string;
  secretPath: string;
};

type InfisicalAuthResponse = {
  accessToken?: string;
  expiresIn?: number;
  accessTokenMaxTTL?: number;
  tokenType?: string;
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

function normalizeSiteUrl(value: string) {
  const trimmed = value.trim().replace(/\/+$/, "");
  const parsed = new URL(trimmed);
  if (parsed.protocol !== "https:" && process.env.NODE_ENV === "production") {
    throw new Error("INFISICAL_SITE_URL must use HTTPS in production.");
  }
  return trimmed;
}

function normalizeSecretPath(value: string) {
  const normalized = value.trim();
  if (!normalized || normalized === "/") return "/";
  return `/${normalized.replace(/^\/+|\/+$/g, "")}`;
}

export function getInfisicalConfig(): InfisicalConfig {
  return {
    siteUrl: normalizeSiteUrl(process.env.INFISICAL_SITE_URL?.trim() || DEFAULT_INFISICAL_SITE_URL),
    clientId: requiredEnv("INFISICAL_CLIENT_ID"),
    clientSecret: requiredEnv("INFISICAL_CLIENT_SECRET"),
    projectId: requiredEnv("INFISICAL_PROJECT_ID"),
    environment: requiredEnv("INFISICAL_ENVIRONMENT"),
    secretPath: normalizeSecretPath(requiredEnv("INFISICAL_SECRET_PATH")),
  };
}

export function sanitizeInfisicalError(_error: unknown) {
  return "Infisical credential operation failed.";
}

export function buildZohoCredentialRef(config: InfisicalConfig) {
  const path = config.secretPath === "/" ? "" : config.secretPath.replace(/^\//, "");
  return `infisical://${config.environment}/${path ? `${path}/` : ""}${ZOHO_REFRESH_TOKEN_SECRET}`;
}

async function getInfisicalAccessToken(config: InfisicalConfig, fetchImpl: FetchLike) {
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
  if (!response.ok || !payload.accessToken) {
    throw new Error("Infisical Universal Auth failed.");
  }
  return payload.accessToken;
}

function secretUrl(config: InfisicalConfig, secretName: string) {
  return `${config.siteUrl}/api/v4/secrets/${encodeURIComponent(secretName)}`;
}

function secretQuery(config: InfisicalConfig) {
  const query = new URLSearchParams({
    projectId: config.projectId,
    environment: config.environment,
    secretPath: config.secretPath,
    type: "shared",
    viewSecretValue: "true",
    expandSecretReferences: "false",
  });
  return query.toString();
}

async function readInfisicalSecretWithToken({
  secretName,
  accessToken,
  config,
  fetchImpl,
}: {
  secretName: string;
  accessToken: string;
  config: InfisicalConfig;
  fetchImpl: FetchLike;
}) {
  const response = await fetchImpl(`${secretUrl(config, secretName)}?${secretQuery(config)}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({})) as InfisicalSecretResponse;
  const value = payload.secret?.secretValue?.trim();
  if (!response.ok || !value) {
    throw new Error(`Infisical secret ${secretName} is unavailable.`);
  }
  return value;
}

export async function readZohoClientCredentials({
  config = getInfisicalConfig(),
  fetchImpl = fetch,
}: {
  config?: InfisicalConfig;
  fetchImpl?: FetchLike;
} = {}) {
  const accessToken = await getInfisicalAccessToken(config, fetchImpl);
  const [clientId, clientSecret] = await Promise.all([
    readInfisicalSecretWithToken({ secretName: ZOHO_CLIENT_ID_SECRET, accessToken, config, fetchImpl }),
    readInfisicalSecretWithToken({ secretName: ZOHO_CLIENT_SECRET_SECRET, accessToken, config, fetchImpl }),
  ]);
  return { clientId, clientSecret };
}

export async function writeZohoRefreshTokenSecret({
  refreshToken,
  config = getInfisicalConfig(),
  fetchImpl = fetch,
}: {
  refreshToken: string;
  config?: InfisicalConfig;
  fetchImpl?: FetchLike;
}) {
  const value = refreshToken.trim();
  if (!value) throw new Error("Zoho refresh token is empty.");
  const accessToken = await getInfisicalAccessToken(config, fetchImpl);
  const body = {
    projectId: config.projectId,
    environment: config.environment,
    secretValue: value,
    secretPath: config.secretPath,
    type: "shared",
  };
  const updateResponse = await fetchImpl(secretUrl(config, ZOHO_REFRESH_TOKEN_SECRET), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!updateResponse.ok && updateResponse.status !== 404) {
    throw new Error("Zoho credential could not be stored securely.");
  }

  if (updateResponse.status === 404) {
    const createResponse = await fetchImpl(secretUrl(config, ZOHO_REFRESH_TOKEN_SECRET), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (!createResponse.ok) {
      throw new Error("Zoho credential could not be stored securely.");
    }
  }

  return { credentialRef: buildZohoCredentialRef(config) };
}

export async function readZohoRefreshTokenSecret({
  credentialRef,
  config = getInfisicalConfig(),
  fetchImpl = fetch,
}: {
  credentialRef: string;
  config?: InfisicalConfig;
  fetchImpl?: FetchLike;
}) {
  if (credentialRef !== buildZohoCredentialRef(config)) {
    throw new Error("Zoho credential reference is invalid.");
  }
  const accessToken = await getInfisicalAccessToken(config, fetchImpl);
  return readInfisicalSecretWithToken({
    secretName: ZOHO_REFRESH_TOKEN_SECRET,
    accessToken,
    config,
    fetchImpl,
  });
}
