import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Marketing Hub derives Instagram connected state from linked account and opaque Facebook Page credential ref", () => {
  const source = readFileSync("app/admin/marketing/integrations/page.tsx", "utf8");

  assert.match(source, /function hasLinkedInstagramAccount\(state: ConfigurationState\)/);
  assert.match(source, /configurationValue\(state, "instagram_login_account_id"\)/);
  assert.match(source, /instagramAccountId/);
  assert.match(
    source,
    /metaInstagramConnected = item\.provider === "meta" && hasCredentialRef\(configuration, "facebook_pages"\) && hasLinkedInstagramAccount\(configuration\)/,
  );
  assert.doesNotMatch(
    source,
    /metaInstagramConnected = item\.provider === "meta" && hasCredentialRef\(configuration, "instagram"\)/,
  );
});
