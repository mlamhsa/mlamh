import { createHash } from "node:crypto";

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

export type GcpSecretManagerConfig = {
  projectId: string;
  projectNumber: string;
  serviceAccountEmail: string;
  workloadIdentityPoolId: string;
  workloadIdentityPoolProviderId: string;
  secretId: string;
};

type FetchLike = typeof fetch;

export function getGcpSecretManagerConfig(): GcpSecretManagerConfig {
  return {
    projectId: requiredEnv("GCP_PROJECT_ID"),
    projectNumber: requiredEnv("GCP_PROJECT_NUMBER"),
    serviceAccountEmail: requiredEnv("GCP_SERVICE_ACCOUNT_EMAIL"),
    workloadIdentityPoolId: requiredEnv("GCP_WORKLOAD_IDENTITY_POOL_ID"),
    workloadIdentityPoolProviderId: requiredEnv("GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID"),
    secretId: requiredEnv("GCP_ZOHO_MAIL_SECRET_ID"),
  };
}

export function buildZohoCredentialRef(config: GcpSecretManagerConfig) {
  const digest = createHash("sha256")
    .update(`${config.projectId}:${config.secretId}:zoho-mail`)
    .digest("hex")
    .slice(0, 24);
  return `cred_${digest}`;
}

function providerAudience(config: GcpSecretManagerConfig) {
  return `//iam.googleapis.com/projects/${config.projectNumber}/locations/global/workloadIdentityPools/${config.workloadIdentityPoolId}/providers/${config.workloadIdentityPoolProviderId}`;
}

async function getFederatedAccessToken(config: GcpSecretManagerConfig, fetchImpl: FetchLike) {
  const subjectToken = process.env.VERCEL_OIDC_TOKEN?.trim();
  if (!subjectToken) throw new Error("Vercel OIDC token is not available.");

  const response = await fetchImpl("https://sts.googleapis.com/v1/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      audience: providerAudience(config),
      grantType: "urn:ietf:params:oauth:grant-type:token-exchange",
      requestedTokenType: "urn:ietf:params:oauth:token-type:access_token",
      scope: "https://www.googleapis.com/auth/cloud-platform",
      subjectToken,
      subjectTokenType: "urn:ietf:params:oauth:token-type:jwt",
    }),
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({})) as { access_token?: string };
  if (!response.ok || !payload.access_token) throw new Error("GCP workload identity exchange failed.");
  return payload.access_token;
}

async function getServiceAccountAccessToken(config: GcpSecretManagerConfig, fetchImpl: FetchLike) {
  const federatedToken = await getFederatedAccessToken(config, fetchImpl);
  const account = encodeURIComponent(config.serviceAccountEmail);
  const response = await fetchImpl(
    `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${account}:generateAccessToken`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${federatedToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        scope: ["https://www.googleapis.com/auth/cloud-platform"],
        lifetime: "600s",
      }),
      cache: "no-store",
    },
  );
  const payload = await response.json().catch(() => ({})) as { accessToken?: string };
  if (!response.ok || !payload.accessToken) throw new Error("GCP service account impersonation failed.");
  return payload.accessToken;
}

function secretBase(config: GcpSecretManagerConfig) {
  return `https://secretmanager.googleapis.com/v1/projects/${encodeURIComponent(config.projectId)}/secrets/${encodeURIComponent(config.secretId)}`;
}

export async function writeZohoRefreshTokenSecret({
  refreshToken,
  config = getGcpSecretManagerConfig(),
  fetchImpl = fetch,
}: {
  refreshToken: string;
  config?: GcpSecretManagerConfig;
  fetchImpl?: FetchLike;
}) {
  if (!refreshToken.trim()) throw new Error("Zoho refresh token is empty.");
  const accessToken = await getServiceAccountAccessToken(config, fetchImpl);
  const response = await fetchImpl(`${secretBase(config)}:addVersion`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      payload: { data: Buffer.from(refreshToken, "utf8").toString("base64") },
    }),
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({})) as { name?: string };
  if (!response.ok || !payload.name) throw new Error("Zoho credential could not be stored securely.");
  return {
    credentialRef: buildZohoCredentialRef(config),
    versionName: payload.name,
  };
}

export async function readZohoRefreshTokenSecret({
  credentialRef,
  config = getGcpSecretManagerConfig(),
  fetchImpl = fetch,
}: {
  credentialRef: string;
  config?: GcpSecretManagerConfig;
  fetchImpl?: FetchLike;
}) {
  if (credentialRef !== buildZohoCredentialRef(config)) throw new Error("Zoho credential reference is invalid.");
  const accessToken = await getServiceAccountAccessToken(config, fetchImpl);
  const response = await fetchImpl(`${secretBase(config)}/versions/latest:access`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({})) as { payload?: { data?: string } };
  if (!response.ok || !payload.payload?.data) throw new Error("Zoho credential could not be retrieved securely.");
  const refreshToken = Buffer.from(payload.payload.data, "base64").toString("utf8").trim();
  if (!refreshToken) throw new Error("Zoho credential is empty.");
  return refreshToken;
}
