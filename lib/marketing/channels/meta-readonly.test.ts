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
  assert.match(source, /\.\.\.previous/);
  assert.doesNotMatch(source, /configuration_state:[^\n]*pageToken/);
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
