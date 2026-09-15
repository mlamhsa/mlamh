import { createSign } from "node:crypto";

type AppleRevocationResult =
  | { ok: true }
  | {
      ok: false;
      code: "APPLE_REVOCATION_CONFIG_MISSING" | "APPLE_TOKEN_EXCHANGE_FAILED" | "APPLE_REVOCATION_FAILED";
    };

type AppleTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  error?: string;
};

function base64Url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function getAppleRevocationConfig() {
  const teamId = process.env.APPLE_TEAM_ID?.trim();
  const keyId = process.env.APPLE_KEY_ID?.trim();
  const privateKey = process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  const clientId = process.env.APPLE_NATIVE_CLIENT_ID?.trim() || "net.mlamh.app";

  if (!teamId || !keyId || !privateKey || !clientId) return null;
  return { teamId, keyId, privateKey, clientId };
}

function createAppleClientSecret(config: NonNullable<ReturnType<typeof getAppleRevocationConfig>>) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "ES256", kid: config.keyId }));
  const payload = base64Url(
    JSON.stringify({
      iss: config.teamId,
      iat: now,
      exp: now + 5 * 60,
      aud: "https://appleid.apple.com",
      sub: config.clientId,
    }),
  );
  const signingInput = `${header}.${payload}`;
  const signer = createSign("SHA256");
  signer.update(signingInput);
  signer.end();
  const signature = signer.sign({ key: config.privateKey, dsaEncoding: "ieee-p1363" });
  return `${signingInput}.${base64Url(signature)}`;
}

export async function revokeAppleAuthorizationCode(authorizationCode: string): Promise<AppleRevocationResult> {
  const config = getAppleRevocationConfig();
  if (!config) return { ok: false, code: "APPLE_REVOCATION_CONFIG_MISSING" };

  const clientSecret = createAppleClientSecret(config);
  const tokenResponse = await fetch("https://appleid.apple.com/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: clientSecret,
      code: authorizationCode,
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  }).catch(() => null);

  if (!tokenResponse?.ok) return { ok: false, code: "APPLE_TOKEN_EXCHANGE_FAILED" };

  const tokenPayload = (await tokenResponse.json().catch(() => null)) as AppleTokenResponse | null;
  const token = tokenPayload?.refresh_token?.trim() || tokenPayload?.access_token?.trim();
  if (!token) return { ok: false, code: "APPLE_TOKEN_EXCHANGE_FAILED" };

  const tokenTypeHint = tokenPayload?.refresh_token ? "refresh_token" : "access_token";
  const revokeResponse = await fetch("https://appleid.apple.com/auth/revoke", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: clientSecret,
      token,
      token_type_hint: tokenTypeHint,
    }),
    cache: "no-store",
  }).catch(() => null);

  if (!revokeResponse?.ok) return { ok: false, code: "APPLE_REVOCATION_FAILED" };
  return { ok: true };
}
