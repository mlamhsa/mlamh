import test from "node:test";
import assert from "node:assert/strict";

import {
  buildZohoCredentialRef,
  readZohoClientCredentials,
  readZohoRefreshTokenSecret,
  sanitizeInfisicalError,
  writeZohoRefreshTokenSecret,
  type InfisicalConfig,
} from "./infisical";

const config: InfisicalConfig = {
  siteUrl: "https://app.infisical.test",
  clientId: "machine-client-id",
  clientSecret: "machine-client-secret",
  projectId: "project-id",
  environment: "prod",
  secretPath: "/zoho",
};

function authResponse() {
  return Response.json({
    accessToken: "short-lived-infisical-token",
    expiresIn: 3600,
    tokenType: "Bearer",
  });
}

test("Infisical credential ref is deterministic and contains no credential value", () => {
  assert.equal(
    buildZohoCredentialRef(config),
    "infisical://prod/zoho/ZOHO_REFRESH_TOKEN",
  );
});

test("Universal Auth obtains one short-lived token then reads Zoho client credentials", async () => {
  const calls: Array<{ url: string; method: string }> = [];
  const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    calls.push({ url, method });

    if (url.endsWith("/api/v1/auth/universal-auth/login")) {
      assert.equal(method, "POST");
      const body = new URLSearchParams(String(init?.body));
      assert.equal(body.get("clientId"), config.clientId);
      assert.equal(body.get("clientSecret"), config.clientSecret);
      return authResponse();
    }

    const authorization = (init?.headers as Record<string, string>).Authorization;
    assert.equal(authorization, "Bearer short-lived-infisical-token");
    const parsed = new URL(url);
    assert.equal(parsed.searchParams.get("projectId"), config.projectId);
    assert.equal(parsed.searchParams.get("environment"), "prod");
    assert.equal(parsed.searchParams.get("secretPath"), "/zoho");

    if (parsed.pathname.endsWith("/ZOHO_CLIENT_ID")) {
      return Response.json({ secret: { secretKey: "ZOHO_CLIENT_ID", secretValue: "zoho-client-id" } });
    }
    if (parsed.pathname.endsWith("/ZOHO_CLIENT_SECRET")) {
      return Response.json({ secret: { secretKey: "ZOHO_CLIENT_SECRET", secretValue: "zoho-client-secret" } });
    }
    throw new Error("Unexpected mocked request");
  }) as typeof fetch;

  const credentials = await readZohoClientCredentials({ config, fetchImpl });
  assert.deepEqual(credentials, {
    clientId: "zoho-client-id",
    clientSecret: "zoho-client-secret",
  });
  assert.equal(calls.filter((call) => call.url.includes("universal-auth/login")).length, 1);
  assert.equal(calls.length, 3);
});

test("stores Zoho refresh token by updating the shared Infisical secret", async () => {
  let writeBody: Record<string, unknown> | null = null;
  const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith("/api/v1/auth/universal-auth/login")) return authResponse();
    assert.equal(url, "https://app.infisical.test/api/v4/secrets/ZOHO_REFRESH_TOKEN");
    assert.equal(init?.method, "PATCH");
    writeBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return Response.json({ secret: { secretKey: "ZOHO_REFRESH_TOKEN" } });
  }) as typeof fetch;

  const result = await writeZohoRefreshTokenSecret({
    refreshToken: "mock-refresh-token",
    config,
    fetchImpl,
  });
  assert.equal(result.credentialRef, "infisical://prod/zoho/ZOHO_REFRESH_TOKEN");
  assert.equal(writeBody?.projectId, config.projectId);
  assert.equal(writeBody?.environment, "prod");
  assert.equal(writeBody?.secretPath, "/zoho");
  assert.equal(writeBody?.secretValue, "mock-refresh-token");
});

test("creates Zoho refresh token secret when it does not exist", async () => {
  const methods: string[] = [];
  const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith("/api/v1/auth/universal-auth/login")) return authResponse();
    methods.push(init?.method ?? "GET");
    if (init?.method === "PATCH") return new Response(null, { status: 404 });
    if (init?.method === "POST") return Response.json({ secret: { secretKey: "ZOHO_REFRESH_TOKEN" } });
    throw new Error("Unexpected mocked request");
  }) as typeof fetch;

  await writeZohoRefreshTokenSecret({
    refreshToken: "mock-refresh-token",
    config,
    fetchImpl,
  });
  assert.deepEqual(methods, ["PATCH", "POST"]);
});

test("reads refresh token only for the expected opaque credential ref", async () => {
  let calls = 0;
  const fetchImpl = (async (input: string | URL | Request) => {
    calls += 1;
    const url = String(input);
    if (url.endsWith("/api/v1/auth/universal-auth/login")) return authResponse();
    return Response.json({
      secret: { secretKey: "ZOHO_REFRESH_TOKEN", secretValue: "mock-refresh-token" },
    });
  }) as typeof fetch;

  const value = await readZohoRefreshTokenSecret({
    credentialRef: buildZohoCredentialRef(config),
    config,
    fetchImpl,
  });
  assert.equal(value, "mock-refresh-token");
  assert.equal(calls, 2);
});

test("invalid credential ref fails before Universal Auth or secret read", async () => {
  let called = false;
  await assert.rejects(
    readZohoRefreshTokenSecret({
      credentialRef: "infisical://prod/zoho/OTHER_SECRET",
      config,
      fetchImpl: (async () => {
        called = true;
        throw new Error("must not run");
      }) as typeof fetch,
    }),
    /credential reference is invalid/i,
  );
  assert.equal(called, false);
});

test("Infisical errors are sanitized without echoing secret material", () => {
  const sanitized = sanitizeInfisicalError(
    new Error("Bearer short-lived-token clientSecret=do-not-log"),
  );
  assert.equal(sanitized, "Infisical credential operation failed.");
  assert.equal(sanitized.includes("do-not-log"), false);
});
