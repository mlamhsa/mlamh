import test from "node:test";
import assert from "node:assert/strict";

import {
  buildZohoCredentialRef,
  readZohoRefreshTokenSecret,
  writeZohoRefreshTokenSecret,
  type GcpSecretManagerConfig,
} from "./gcp-secret-manager";

const config: GcpSecretManagerConfig = {
  projectId: "mlamh-test",
  projectNumber: "123456789",
  serviceAccountEmail: "mlamh-vercel-zoho-mail@mlamh-test.iam.gserviceaccount.com",
  workloadIdentityPoolId: "vercel",
  workloadIdentityPoolProviderId: "mlamh-production",
  secretId: "mlamh-zoho-mail-refresh-token",
};

function installOidc() {
  const previous = process.env.VERCEL_OIDC_TOKEN;
  process.env.VERCEL_OIDC_TOKEN = "mock-vercel-oidc";
  return () => {
    if (previous === undefined) delete process.env.VERCEL_OIDC_TOKEN;
    else process.env.VERCEL_OIDC_TOKEN = previous;
  };
}

test("GCP credential ref is opaque and deterministic", () => {
  const value = buildZohoCredentialRef(config);
  assert.match(value, /^cred_[a-f0-9]{24}$/);
  assert.equal(value, buildZohoCredentialRef(config));
  assert.equal(value.includes(config.secretId), false);
});

test("stores Zoho refresh token as a new Secret Manager version", async () => {
  const restore = installOidc();
  const calls: string[] = [];
  const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    calls.push(url);
    if (url === "https://sts.googleapis.com/v1/token") {
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      assert.equal(body.subjectToken, "mock-vercel-oidc");
      return Response.json({ access_token: "federated" });
    }
    if (url.includes("iamcredentials.googleapis.com")) {
      return Response.json({ accessToken: "service-account-token" });
    }
    assert.equal(url, "https://secretmanager.googleapis.com/v1/projects/mlamh-test/secrets/mlamh-zoho-mail-refresh-token:addVersion");
    const body = JSON.parse(String(init?.body)) as { payload: { data: string } };
    assert.equal(Buffer.from(body.payload.data, "base64").toString("utf8"), "refresh-secret");
    return Response.json({ name: "projects/mlamh-test/secrets/mlamh-zoho-mail-refresh-token/versions/7" });
  }) as typeof fetch;

  try {
    const result = await writeZohoRefreshTokenSecret({ refreshToken: "refresh-secret", config, fetchImpl });
    assert.equal(result.credentialRef, buildZohoCredentialRef(config));
    assert.equal(calls.length, 3);
  } finally {
    restore();
  }
});

test("reads latest Zoho refresh token only for the expected credential ref", async () => {
  const restore = installOidc();
  let calls = 0;
  const fetchImpl = (async (input: string | URL | Request) => {
    calls += 1;
    const url = String(input);
    if (url === "https://sts.googleapis.com/v1/token") return Response.json({ access_token: "federated" });
    if (url.includes("iamcredentials.googleapis.com")) return Response.json({ accessToken: "service-account-token" });
    assert.equal(url, "https://secretmanager.googleapis.com/v1/projects/mlamh-test/secrets/mlamh-zoho-mail-refresh-token/versions/latest:access");
    return Response.json({ payload: { data: Buffer.from("refresh-secret", "utf8").toString("base64") } });
  }) as typeof fetch;

  try {
    const refreshToken = await readZohoRefreshTokenSecret({
      credentialRef: buildZohoCredentialRef(config),
      config,
      fetchImpl,
    });
    assert.equal(refreshToken, "refresh-secret");
    assert.equal(calls, 3);
  } finally {
    restore();
  }
});

test("invalid credential ref fails before any external request", async () => {
  let called = false;
  await assert.rejects(
    readZohoRefreshTokenSecret({
      credentialRef: "cred_invalid",
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
