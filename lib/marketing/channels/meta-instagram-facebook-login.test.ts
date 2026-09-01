import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Instagram Facebook Login uses Meta's instagram_content_publish scope", () => {
  const source = readFileSync("lib/marketing/channels/meta-instagram-facebook-login.ts", "utf8");

  assert.match(source, /"instagram_content_publish"/);
  assert.doesNotMatch(source, /instagram_content_publishing/);
});

test("Instagram Facebook Login does not request unavailable Insights scopes for the current Meta app flow", () => {
  const source = readFileSync("lib/marketing/channels/meta-instagram-facebook-login.ts", "utf8");

  assert.match(source, /"instagram_basic"/);
  assert.match(source, /"instagram_content_publish"/);
  assert.match(source, /"instagram_manage_messages"/);
  assert.match(source, /"pages_read_engagement"/);
  assert.match(source, /"pages_show_list"/);
  assert.match(source, /"read_insights"/);
  assert.match(source, /"business_management"/);
  assert.doesNotMatch(source, /"instagram_manage_insights"/);
  assert.doesNotMatch(source, /"instagram_business_manage_insights"/);
});
