import test from "node:test";
import assert from "node:assert/strict";

import { getOpportunityDeadline, isOpportunityOpenForSeo } from "./opportunity.ts";

test("deadline resolution covers current and legacy opportunity expiry fields", () => {
  assert.equal(getOpportunityDeadline({ id: 1, application_deadline: "2026-10-01", expires_at: "2026-09-01" }), "2026-10-01");
  assert.equal(getOpportunityDeadline({ id: 1, deadline: "2026-09-20", expires_at: "2026-09-01" }), "2026-09-20");
  assert.equal(getOpportunityDeadline({ id: 1, expires_at: "2026-09-01T12:00:00Z" }), "2026-09-01T12:00:00Z");
});

test("expired opportunities are excluded from active SEO inventory", () => {
  const now = new Date("2026-09-07T12:00:00Z");
  assert.equal(isOpportunityOpenForSeo({ id: 1, status: "published", application_deadline: "2026-09-01" }, now), false);
  assert.equal(isOpportunityOpenForSeo({ id: 2, status: "open", application_deadline: "2026-09-20" }, now), true);
  assert.equal(isOpportunityOpenForSeo({ id: 3, status: "draft", application_deadline: "2026-09-20" }, now), false);
});

test("an opportunity without a known deadline remains eligible while its public status is open", () => {
  assert.equal(isOpportunityOpenForSeo({ id: 1, status: "published" }, new Date("2026-09-07T12:00:00Z")), true);
});
