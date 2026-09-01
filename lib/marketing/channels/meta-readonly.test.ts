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
  assert.doesNotMatch(source, /publish|reply|send|comment/i);
});

test("Meta connection test verifies MLAMH and mlamhco and persists safe sync state only", () => {
  const source = readFileSync("lib/marketing/channels/meta-readonly.ts", "utf8");
  assert.match(source, /page\.name\.trim\(\)\.toUpperCase\(\) !== "MLAMH"/);
  assert.match(source, /toLowerCase\(\) !== "mlamhco"/);
  assert.match(source, /last_sync_at: now/);
  assert.match(source, /last_success_at: now/);
  assert.match(source, /supported_capabilities: capabilities/);
  assert.match(source, /credential_refs/);
  assert.doesNotMatch(source, /configuration_state:[^\n]*pageToken/);
});
