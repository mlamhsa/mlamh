import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Meta connection test remains GET-only and keeps outbound disabled", () => {
  const source = readFileSync("lib/marketing/channels/meta-readonly.ts", "utf8");
  assert.match(source, /method: "GET"/);
  assert.doesNotMatch(source, /method: "(?:POST|PATCH|PUT|DELETE)"/);
  assert.doesNotMatch(source, /writeMetaSecret|deleteMetaSecret|external_execution_enabled/);
  assert.match(source, /publishing: false/);
  assert.match(source, /replies: false/);
  assert.match(source, /messages_outbound: false/);
  assert.match(source, /comments_mutation: false/);
  assert.match(source, /webhooks_enabled_by_test: false/);
});

test("Meta core identity stays connected when optional insights fail", () => {
  const source = readFileSync("lib/marketing/channels/meta-readonly.ts", "utf8");
  assert.match(source, /page\.name\.trim\(\)\.toUpperCase\(\) !== "MLAMH"/);
  assert.match(source, /toLowerCase\(\) !== "mlamhco"/);
  assert.match(source, /return null;/);
  assert.match(source, /status: "connected"/);
  assert.match(source, /read_identity: true/);
  assert.match(source, /diagnostics: errors/);
});

test("Meta v26 Page Insights probe avoids removed page_impressions metric", () => {
  const source = readFileSync("lib/marketing/channels/meta-readonly.ts", "utf8");
  assert.match(source, /metric: "page_post_engagements", period: "day"/);
  assert.doesNotMatch(source, /metric: "page_impressions"/);
});

test("Instagram and Page Insights OAuth requests only the missing read permissions", () => {
  const oauthSource = readFileSync("lib/marketing/channels/meta-instagram-facebook-login.ts", "utf8");
  assert.match(oauthSource, /"instagram_manage_insights"/);
  assert.match(oauthSource, /"read_insights"/);
  assert.match(oauthSource, /"pages_read_engagement"/);
  assert.match(oauthSource, /"instagram_basic"/);
});

test("Insights diagnostics remain sanitized", () => {
  const source = readFileSync("lib/marketing/channels/meta-readonly.ts", "utf8");
  assert.match(source, /error\.code === 190/);
  assert.match(source, /\[10, 200, 294\]/);
  assert.match(source, /code: error\.code/);
  assert.match(source, /subcode: error\.subcode/);
  assert.doesNotMatch(source, /lastError = errors[^\n]*rawMessage/);
});
