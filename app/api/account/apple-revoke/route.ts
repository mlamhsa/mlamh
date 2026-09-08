import { createSign } from "node:crypto";
import { NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth/request-user";

type AppleTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  id_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

function base64Url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

function createAppleClientSecret() {
  const teamId = process.env.APPLE_SIGN_IN_TEAM_ID?.trim();
  const keyId = process.env.APPLE_SIGN_IN_KEY_ID?.trim();
  const privateKeyRaw = process.env.APPLE_SIGN_IN_PRIVATE_KEY?.trim();
  const clientId = process.env.APPLE_SIGN_IN_CLIENT_ID?.trim() || "net.mlamh.app";

  if (!teamId || !keyId || !privateKeyRaw) return null;

  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "ES256", kid: keyId, typ: "JWT" }));
  const payload = base64Url(JSON.stringify({
    iss: teamId,
    iat: now,
    exp: now + 60 * 60 * 24 * 30,
    aud: "https://appleid.apple.com",
    sub: clientId,
  }));
  const signingInput = `${header}.${payload}`;
  const signer = createSign("SHA256");
  signer.update(signingInput);
  signer.end();
  const signature = signer.sign({
    key: privateKeyRaw.replace(/\\n/g, "\n"),
    dsaEncoding: "ieee-p1363",
  });

  return { clientId, clientSecret: `${signingInput}.${base64Url(signature)}` };
}

async function postAppleForm(path: "/auth/token" | "/auth/revoke", values: Record<string, string>) {
  return fetch(`https://appleid.apple.com${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(values),
    cache: "no-store",
  });
}

export async function POST(request: Request) {
  const auth = await getRequestUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 });

  let body: { authorizationCode?: unknown } = {};
  try { body = await request.json() as { authorizationCode?: unknown }; }
  catch { return NextResponse.json({ ok: false, code: "INVALID_BODY" }, { status: 400 }); }

  const authorizationCode = typeof body.authorizationCode === "string" ? body.authorizationCode.trim() : "";
  if (!authorizationCode) return NextResponse.json({ ok: false, code: "MISSING_AUTHORIZATION_CODE" }, { status: 400 });

  const credentials = createAppleClientSecret();
  if (!credentials) {
    return NextResponse.json({ ok: false, code: "APPLE_REVOCATION_NOT_CONFIGURED" }, { status: 503 });
  }

  try {
    const tokenResponse = await postAppleForm("/auth/token", {
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      code: authorizationCode,
      grant_type: "authorization_code",
    });
    const tokenPayload = await tokenResponse.json().catch(() => ({})) as AppleTokenResponse;
    const refreshToken = tokenPayload.refresh_token?.trim();
    if (!tokenResponse.ok || !refreshToken) {
      return NextResponse.json({ ok: false, code: "APPLE_TOKEN_EXCHANGE_FAILED" }, { status: 502 });
    }

    const revokeResponse = await postAppleForm("/auth/revoke", {
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      token: refreshToken,
      token_type_hint: "refresh_token",
    });
    if (!revokeResponse.ok) {
      return NextResponse.json({ ok: false, code: "APPLE_REVOCATION_FAILED" }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, code: "APPLE_REVOCATION_FAILED" }, { status: 502 });
  }
}
