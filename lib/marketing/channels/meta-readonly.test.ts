import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Meta connection test is read-only against Meta and keeps credentials server-side", () => {
  const source = readFileSync("lib/marketing/channels/meta-readonly.ts", "utf8");
  assert.match(source, /readMetaSecrets\(\[META_SECRET_NAMES\.facebookPageTokens\]\)/);
  assert.match(source, /method: "GET"/);
  assert.doesNotMatch(source, /method: "(?:POST|PATCH|PUT|DELETE)"/);
  assert.doesNotMatch(source, /writeMetaSecret|deleteMetaSecret/);
  assert.doesNotMatch(source, /external_execution_enabled/);
  assert.match(source, /publishing: false/);
  assert.match(source, /replies: false/);
  assert.match(source, /messages_outbound: false/);
  assert.match(source, /comments_mutation: false/);
  assert.match(source, /webhooks_enabled_by_test: false/);
});

test("Meta connection test verifies MLAMH and mlamhco and persists safe sync state only", () => {
  const source = readFileSync("lib/marketing/channels/meta-readonly.ts", "utf8");
  assert.match(source, /page\.name\.trim\(\)\.toUpperCase\(\) !== "MLAMH"/);
  assert.match(source, /toLowerCase\(\) !== "mlamhco"/);
  assert.match(source, /last_sync_at: now/);
  assert.match(source, /last_success_at: now/);
  assert.match(source, /supported_capabilities: capabilities/);
  assert.match(source, /diagnostics: errors/);
  assert.match(source, /\.\.\.previous/);
  assert.doesNotMatch(source, /configuration_state:[^\n]*pageToken/);
});

test("Meta Insights probes use v26 Page metric parameters and preserve core read-only success", () => {
  const source = readFileSync("lib/marketing/channels/meta-readonly.ts", "utf8");
  assert.match(source, /facebook_page_insights/);
  assert.match(source, /metric: "page_post_engagements", period: "day"/);
  assert.doesNotMatch(source, /metric: "page_impressions"/);
  assert.match(source, /instagram_account_insights/);
  assert.match(source, /metric: "reach", period: "day"/);
  assert.match(source, /instagram_media_insights/);
  assert.match(source, /metric: "reach,likes,comments,saved,shares"/);
  assert.match(source, /return null;/);
  assert.match(source, /status: "connected"/);
  assert.match(source, /read_identity: true/);
});

test("Meta Insights diagnostics classify failures without persisting raw API messages or secrets", () => {
  const source = readFileSync("lib/marketing/channels/meta-readonly.ts", "utf8");
  assert.match(source, /type SafeErrorCategory = "permission" \| "unsupported_metric" \| "api_version" \| "account_capability" \| "invalid_request" \| "token" \| "api_error"/);
  assert.match(source, /error\.code === 190/);
  assert.match(source, /\[10, 200, 294\]/);
  assert.match(source, /message\.includes\("metric"\)/);
  assert.match(source, /message\.includes\("version"\)/);
  assert.match(source, /message\.includes\("professional"\)/);
  assert.match(source, /category,\n      message: `Meta read-only/);
  assert.match(source, /code: error\.code/);
  assert.match(source, /subcode: error\.subcode/);
  assert.doesNotMatch(source, /lastError = errors[^\n]*rawMessage/);
  assert.doesNotMatch(source, /diagnostics:.*rawMessage/);
});

test("Instagram Facebook Login keeps Insights optional when the app cannot request Instagram insights permission", () => {
  const oauthSource = readFileSync("lib/marketing/channels/meta-instagram-facebook-login.ts", "utf8");
  assert.match(oauthSource, /"instagram_basic"/);
  assert.match(oauthSource, /"pages_read_engagement"/);
  assert.match(oauthSource, /"read_insights"/);
  assert.doesNotMatch(oauthSource, /"instagram_manage_insights"/);
  assert.doesNotMatch(oauthSource, /"instagram_business_manage_insights"/);
});

test("Marketing Hub wires the Meta read-only test only for a connected Meta integration", () => {
  const page = readFileSync("app/admin/marketing/integrations/page.tsx", "utf8");
  const form = readFileSync("app/admin/marketing/integrations/MetaConnectionTestForm.tsx", "utf8");
  assert.match(page, /import \{ MetaConnectionTestForm \} from "\.\/MetaConnectionTestForm"/);
  assert.match(page, /const metaConnected = item\.provider === "meta" && item\.status === "connected" && metaFacebookConnected && metaInstagramConnected/);
  assert.match(page, /\{metaConnected \? <MetaConnectionTestForm isArabic=\{isArabic\} \/> : null\}/);
  assert.match(form, /اختبار اتصال Meta/);
  assert.match(form, /testMetaReadOnlyConnectionAction/);
});
