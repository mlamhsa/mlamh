import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Instagram Facebook Login uses Meta's instagram_content_publish scope", () => {
  const source = readFileSync("lib/marketing/channels/meta-instagram-facebook-login.ts", "utf8");

  assert.match(source, /"instagram_content_publish"/);
  assert.doesNotMatch(source, /instagram_content_publishing/);
});
