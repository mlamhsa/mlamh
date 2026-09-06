import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path: string) {
  return readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8");
}

test("governed email worker accepts approved external support replies", () => {
  const worker = source("lib/marketing/channels/autonomous-executor.ts");
  assert.match(worker, /kind === "outreach_email" \|\| kind === "external_reply"/);
  assert.match(worker, /executeMarketingEmailJob\(row\.id\)/);
});

test("email executor supports support replies without an outreach row", () => {
  const executor = source("lib/marketing/channels/email-executor.ts");
  assert.match(executor, /payload\.kind === "external_reply"/);
  assert.match(executor, /support_tickets/);
  assert.match(executor, /first_response_at/);
  assert.match(executor, /if \(hasOutreachId\)/);
});
