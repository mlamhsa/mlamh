import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";

import {
  buildMetaDeletionConfirmationCode,
  buildMetaInboundTaskCandidate,
  buildMetaLifecycleFingerprint,
  buildMetaWebhookFingerprint,
  normalizeMetaWebhookPayload,
  verifyMetaSignature,
  verifyMetaSignedRequest,
  verifyMetaWebhookChallenge,
} from "./meta-core.ts";
import {
  prepareMetaDataDeletion,
  prepareMetaDeauthorize,
} from "./meta-lifecycle.ts";
import {
  META_SECRET_NAMES,
  buildMetaCredentialRef,
  deleteMetaSecret,
  readMetaSecrets,
  writeMetaSecret,
  type MetaInfisicalConfig,
} from "../credentials/meta-infisical.ts";

const infisicalConfig: MetaInfisicalConfig = {
  siteUrl: "https://app.infisical.test",
  clientId: "machine-client-id",
  clientSecret: "machine-client-secret",
  projectId: "project-id",
  environment: "prod",
  secretPath: "/meta",
};

function signedRequest(payload: Record<string, unknown>, appSecret = "app-secret") {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", appSecret).update(encodedPayload).digest("base64url");
  return `${signature}.${encodedPayload}`;
}

test("Marketing Hub Instagram action uses Facebook Login OAuth and preserves its state cookie", () => {
  const source = readFileSync("app/admin/marketing/integrations/actions.ts", "utf8");
  const action = source.match(/export async function beginMetaInstagramOAuthAction\(\) \{([\s\S]*?)\n\}/)?.[1] ?? "";
  assert.match(source, /createInstagramFacebookLoginOAuthRequest/);
  assert.doesNotMatch(source, /createInstagramOAuthRequest/);
  assert.match(action, /await createInstagramFacebookLoginOAuthRequest\(\)/);
  assert.match(action, /mlamh_meta_instagram_oauth_state/);
});

test("Meta webhook verification succeeds only with the stored verify token", () => {
  assert.equal(verifyMetaWebhookChallenge({
    mode: "subscribe",
    verifyToken: "expected-token",
    challenge: "challenge-123",
    expectedVerifyToken: "expected-token",
  }), "challenge-123");
  assert.equal(verifyMetaWebhookChallenge({
    mode: "subscribe",
    verifyToken: "wrong-token",
    challenge: "challenge-123",
    expectedVerifyToken: "expected-token",
  }), null);
});

test("Meta X-Hub-Signature-256 validation accepts valid and rejects invalid signatures", () => {
  const rawBody = JSON.stringify({ object: "page", entry: [] });
  const appSecret = "app-secret";
  const signature = createHmac("sha256", appSecret).update(rawBody).digest("hex");
  assert.equal(verifyMetaSignature({ rawBody, signatureHeader: `sha256=${signature}`, appSecret }), true);
  assert.equal(verifyMetaSignature({ rawBody, signatureHeader: `sha256=${"0".repeat(64)}`, appSecret }), false);
  assert.equal(verifyMetaSignature({ rawBody, signatureHeader: null, appSecret }), false);
});

test("valid Meta signed_request verifies with HMAC-SHA256", () => {
  const value = signedRequest({ algorithm: "HMAC-SHA256", issued_at: 1_788_000_000, user_id: "ig-user-1" });
  const verified = verifyMetaSignedRequest({ signedRequest: value, appSecret: "app-secret" });
  assert.equal(verified?.userId, "ig-user-1");
  assert.equal(verified?.algorithm, "HMAC-SHA256");
  assert.equal(verified?.issuedAt, 1_788_000_000);
});

test("invalid Meta signed_request is rejected without leaking the app secret", () => {
  const secret = "super-sensitive-app-secret";
  const value = signedRequest({ algorithm: "HMAC-SHA256", user_id: "ig-user-1" }, "different-secret");
  const verified = verifyMetaSignedRequest({ signedRequest: value, appSecret: secret });
  assert.equal(verified, null);
  assert.equal(JSON.stringify(verified).includes(secret), false);
});

test("Meta deauthorize plan removes only the matching Instagram credential ref", () => {
  const value = signedRequest({ algorithm: "HMAC-SHA256", user_id: "ig-user-1" });
  const plan = prepareMetaDeauthorize({
    signedRequest: value,
    appSecret: "app-secret",
    configurationState: {
      instagram_login_account_id: "ig-user-1",
      credential_refs: {
        instagram: "infisical://prod/meta/META_INSTAGRAM_LONG_LIVED_ACCESS_TOKEN",
        facebook_user: "infisical://prod/meta/META_LONG_LIVED_USER_ACCESS_TOKEN",
        facebook_pages: "infisical://prod/meta/META_PAGE_ACCESS_TOKENS_JSON",
      },
    },
  });
  assert.equal(plan?.scope, "instagram");
  assert.equal(plan?.nextCredentialRefs.instagram, undefined);
  assert.equal(plan?.nextCredentialRefs.facebook_user?.includes("META_LONG_LIVED_USER_ACCESS_TOKEN"), true);
  assert.deepEqual(plan?.secretsToDelete, [META_SECRET_NAMES.instagramLongLivedToken]);
  assert.equal(plan?.remainingCredentialCount, 2);
});

test("Meta data deletion request produces stable confirmation code and status URL", () => {
  const value = signedRequest({ algorithm: "HMAC-SHA256", user_id: "ig-user-1" });
  const first = prepareMetaDataDeletion({
    signedRequest: value,
    appSecret: "app-secret",
    requestUrl: "https://mlamh.net/api/marketing/integrations/meta/data-deletion",
  });
  const second = prepareMetaDataDeletion({
    signedRequest: value,
    appSecret: "app-secret",
    requestUrl: "https://mlamh.net/api/marketing/integrations/meta/data-deletion",
  });
  assert.equal(first?.confirmationCode, second?.confirmationCode);
  assert.equal(first?.fingerprint, second?.fingerprint);
  assert.match(first?.statusUrl ?? "", /^https:\/\/mlamh\.net\/api\/marketing\/integrations\/meta\/data-deletion\/status\?code=meta-del-/);
  assert.equal(first?.confirmationCode, buildMetaDeletionConfirmationCode(buildMetaLifecycleFingerprint("data-deletion", value)));
});

test("Meta webhook fingerprint is deterministic for duplicate handling", () => {
  const body = "{\"object\":\"page\"}";
  assert.equal(buildMetaWebhookFingerprint(body), buildMetaWebhookFingerprint(body));
  assert.notEqual(buildMetaWebhookFingerprint(body), buildMetaWebhookFingerprint(`${body} `));
});

test("Instagram DM and comment payloads normalize without outbound execution", () => {
  const payload = {
    object: "instagram",
    entry: [{
      id: "ig-1",
      messaging: [{
        sender: { id: "sender-1" },
        recipient: { id: "ig-1" },
        timestamp: 1_788_000_000_000,
        message: { mid: "ig-mid-1", text: "Hello MLAMH" },
      }],
      changes: [{
        field: "comments",
        value: {
          id: "ig-comment-1",
          media_id: "ig-media-1",
          text: "Great post",
          from: { id: "ig-user-2" },
        },
      }],
    }],
  };
  const events = normalizeMetaWebhookPayload(payload);
  assert.equal(events.length, 2);
  assert.equal(events[0].channel, "instagram");
  assert.equal(events[0].eventType, "dm");
  assert.equal(events[0].externalMessageId, "ig-mid-1");
  assert.equal(events[1].eventType, "comment");
  const candidate = buildMetaInboundTaskCandidate(events[0]);
  assert.equal(candidate.agentId, "faisal");
  assert.equal(candidate.approvalLevel, "auto");
});

test("Facebook Page message and engagement payloads normalize", () => {
  const payload = {
    object: "page",
    entry: [{
      id: "page-1",
      messaging: [{
        sender: { id: "fb-user-1" },
        recipient: { id: "page-1" },
        timestamp: 1_788_000_000_000,
        message: { mid: "fb-mid-1", text: "Casting question" },
      }],
      changes: [{
        field: "feed",
        value: {
          item: "reaction",
          post_id: "page-1_post-1",
          from: { id: "fb-user-2" },
        },
      }],
    }],
  };
  const events = normalizeMetaWebhookPayload(payload);
  assert.equal(events.length, 2);
  assert.equal(events[0].channel, "facebook");
  assert.equal(events[0].eventType, "dm");
  assert.equal(events[1].eventType, "engagement");
});

test("Meta credential refs are opaque Infisical references and contain no secret values", () => {
  const ref = buildMetaCredentialRef(infisicalConfig, META_SECRET_NAMES.facebookLongLivedUserToken);
  assert.equal(ref, "infisical://prod/meta/META_LONG_LIVED_USER_ACCESS_TOKEN");
  assert.equal(ref.includes("machine-client-secret"), false);
});

test("Meta Infisical Universal Auth reads secrets using one short-lived access token", async () => {
  let authCalls = 0;
  const fetchImpl = (async (input: string | URL | Request) => {
    const url = String(input);
    if (url.endsWith("/api/v1/auth/universal-auth/login")) {
      authCalls += 1;
      return Response.json({ accessToken: "short-lived-access" });
    }
    const secretName = decodeURIComponent(url.split("/api/v4/secrets/")[1].split("?")[0]);
    const value = secretName === META_SECRET_NAMES.appId ? "app-id" : "app-secret";
    return Response.json({ secret: { secretKey: secretName, secretValue: value } });
  }) as typeof fetch;
  const values = await readMetaSecrets([META_SECRET_NAMES.appId, META_SECRET_NAMES.appSecret], {
    config: infisicalConfig,
    fetchImpl,
  });
  assert.equal(authCalls, 1);
  assert.equal(values[META_SECRET_NAMES.appId], "app-id");
  assert.equal(values[META_SECRET_NAMES.appSecret], "app-secret");
});

test("Meta long-lived credential write is mocked and never calls Meta outbound APIs", async () => {
  const calls: string[] = [];
  const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    calls.push(url);
    if (url.endsWith("/api/v1/auth/universal-auth/login")) {
      return Response.json({ accessToken: "short-lived-access" });
    }
    assert.equal(init?.method, "PATCH");
    return Response.json({ secret: { secretKey: META_SECRET_NAMES.instagramLongLivedToken } });
  }) as typeof fetch;
  const stored = await writeMetaSecret({
    secretName: META_SECRET_NAMES.instagramLongLivedToken,
    secretValue: "mock-long-lived-token",
    config: infisicalConfig,
    fetchImpl,
  });
  assert.equal(stored.credentialRef, "infisical://prod/meta/META_INSTAGRAM_LONG_LIVED_ACCESS_TOKEN");
  assert.equal(calls.some((url) => url.includes("graph.facebook.com") || url.includes("graph.instagram.com")), false);
});

test("Meta deauthorize credential cleanup is mocked and never calls Meta outbound APIs", async () => {
  const calls: string[] = [];
  const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    calls.push(url);
    if (url.endsWith("/api/v1/auth/universal-auth/login")) {
      return Response.json({ accessToken: "short-lived-access" });
    }
    assert.equal(init?.method, "DELETE");
    return new Response(null, { status: 204 });
  }) as typeof fetch;
  const result = await deleteMetaSecret({
    secretName: META_SECRET_NAMES.instagramLongLivedToken,
    config: infisicalConfig,
    fetchImpl,
  });
  assert.equal(result.deleted, true);
  assert.equal(calls.some((url) => url.includes("facebook.com") || url.includes("instagram.com")), false);
});
