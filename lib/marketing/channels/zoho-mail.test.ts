import test from "node:test";
import assert from "node:assert/strict";

import {
  MLAMH_ZOHO_MAIL_ADDRESS,
  ZOHO_MAIL_PHASE1_SCOPES,
  buildEmailOutreachIdempotencyKey,
  createZohoMailAdapter,
  createZohoOAuthRequest,
  sanitizeZohoError,
  verifyZohoMailAccount,
  type ZohoMailRuntimeConfig,
} from "./zoho-mail-core.ts";

const config: ZohoMailRuntimeConfig = {
  accountsBaseUrl: "https://accounts.example.test",
  apiBaseUrl: "https://mail.example.test",
  clientId: "client-id",
  clientSecret: "client-secret",
  redirectUri: "https://mlamh.net/api/marketing/integrations/zoho/callback",
};

test("Zoho OAuth request uses configured base URL, PKCE, and inbound-capable scopes", () => {
  const request = createZohoOAuthRequest(config);
  const url = new URL(request.authorizationUrl);
  assert.equal(url.origin, "https://accounts.example.test");
  assert.equal(url.pathname, "/oauth/v2/auth");
  assert.equal(url.searchParams.get("scope"), ZOHO_MAIL_PHASE1_SCOPES.join(","));
  assert.equal(url.searchParams.get("access_type"), "offline");
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.ok(url.searchParams.get("code_challenge"));
  assert.ok(request.codeVerifier.length > 40);
  assert.equal(url.searchParams.get("scope")?.includes("ZohoMail.messages.READ"), true);
  assert.equal(url.searchParams.get("scope")?.includes("ZohoMail.messages.CREATE"), true);
});

test("email outreach idempotency key is deterministic", () => {
  assert.equal(buildEmailOutreachIdempotencyKey(42), "outreach-42-email");
  assert.equal(buildEmailOutreachIdempotencyKey(42), buildEmailOutreachIdempotencyKey(42));
});

test("Zoho READ verification accepts only hello@mlamh.net", async () => {
  const fetchImpl = (async (input: string | URL | Request) => {
    assert.equal(String(input), "https://mail.example.test/api/accounts");
    return new Response(JSON.stringify({
      status: { code: 200, description: "success" },
      data: [{ accountId: "acct-1", primaryEmailAddress: MLAMH_ZOHO_MAIL_ADDRESS }],
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
  const verified = await verifyZohoMailAccount({ accessToken: "mock-access", config, fetchImpl });
  assert.deepEqual(verified, { accountId: "acct-1", address: MLAMH_ZOHO_MAIL_ADDRESS });
});

test("mocked Zoho send adapter returns external message id without real email", async () => {
  let called = 0;
  const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
    called += 1;
    assert.equal(String(input), "https://mail.example.test/api/accounts/acct-1/messages");
    assert.equal(init?.method, "POST");
    const headers = init?.headers as Record<string, string>;
    assert.equal(headers.Authorization, "Zoho-oauthtoken mock-access-token");
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    assert.deepEqual(body, {
      fromAddress: MLAMH_ZOHO_MAIL_ADDRESS,
      toAddress: "partner@example.com",
      subject: "Casting partnership",
      content: "Hello from MLAMH",
      mailFormat: "plaintext",
    });
    return new Response(JSON.stringify({
      status: { code: 200, description: "success" },
      data: { messageId: "zoho-message-123", mailId: "<mail-123@example.com>" },
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;

  const adapter = createZohoMailAdapter({
    fetchImpl,
    getAccessToken: async () => "mock-access-token",
    getConnectionState: async () => ({
      status: "connected",
      accountId: "acct-1",
      fromAddress: MLAMH_ZOHO_MAIL_ADDRESS,
      apiBaseUrl: "https://mail.example.test",
    }),
  });
  const result = await adapter.sendMessage?.({
    recipient: { email: "partner@example.com" },
    text: "Hello from MLAMH",
    metadata: { subject: "Casting partnership" },
  });
  assert.equal(called, 1);
  assert.equal(result?.ok, true);
  assert.equal(result?.externalId, "zoho-message-123");
  assert.equal(result?.metadata?.external_message_id, "zoho-message-123");
});

test("limited Zoho integration cannot send and does not call provider", async () => {
  let called = false;
  const adapter = createZohoMailAdapter({
    fetchImpl: (async () => {
      called = true;
      throw new Error("should not be called");
    }) as typeof fetch,
    getAccessToken: async () => "unused",
    getConnectionState: async () => ({
      status: "limited",
      accountId: "acct-1",
      fromAddress: MLAMH_ZOHO_MAIL_ADDRESS,
      apiBaseUrl: "https://mail.example.test",
    }),
  });
  const result = await adapter.sendMessage?.({
    recipient: { email: "partner@example.com" },
    text: "Blocked",
    metadata: { subject: "Blocked" },
  });
  assert.equal(called, false);
  assert.equal(result?.ok, false);
  assert.equal(result?.errorCode, "ZOHO_NOT_CONNECTED");
});

test("Zoho errors sanitize OAuth secrets", () => {
  assert.equal(
    sanitizeZohoError(new Error("Authorization failed with refresh_token=secret-value")),
    "Zoho Mail authentication or configuration failed.",
  );
});
