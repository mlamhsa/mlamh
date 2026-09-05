import assert from "node:assert/strict";
import test from "node:test";

import { getUniversalLink, getWebPathForDeepLink } from "./deep-link-contract.ts";

test("builds canonical opportunity and talent web paths", () => {
  assert.equal(getWebPathForDeepLink({ type: "opportunity", idOrSlug: "riyadh-campaign" }), "/opportunities/riyadh-campaign");
  assert.equal(getWebPathForDeepLink({ type: "talent", slug: "talent name" }), "/talent/talent%20name");
});

test("covers core native account destinations", () => {
  assert.equal(getWebPathForDeepLink({ type: "publisherSetup" }), "/publisher/setup");
  assert.equal(getWebPathForDeepLink({ type: "publisherProfile" }), "/publisher/profile");
  assert.equal(getWebPathForDeepLink({ type: "casting" }), "/casting");
  assert.equal(getWebPathForDeepLink({ type: "notifications" }), "/notifications");
  assert.equal(getWebPathForDeepLink({ type: "profile" }), "/profile");
  assert.equal(getWebPathForDeepLink({ type: "support" }), "/support");
});

test("keeps application list valid when no application id is supplied", () => {
  assert.equal(getWebPathForDeepLink({ type: "application" }), "/applications");
  assert.equal(getWebPathForDeepLink({ type: "application", applicationId: "42" }), "/applications/42");
});

test("builds mlamh.net universal links only", () => {
  assert.equal(getUniversalLink({ type: "casting" }), "https://mlamh.net/casting");
  assert.equal(getUniversalLink({ type: "publisherProfile" }), "https://mlamh.net/publisher/profile");
  assert.equal(getUniversalLink({ type: "conversation", conversationId: "77" }), "https://mlamh.net/messages/77");
});
