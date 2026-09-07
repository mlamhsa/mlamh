import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { getOpportunityDeadline, isOpportunityOpenForSeo } from "./opportunity.ts";

function source(path: string) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

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

test("public opportunity projection normalizes legacy expires_at into the deadline consumed by the detail page", () => {
  const opportunities = source("lib/supabase/opportunities.ts");
  const detailPage = source("app/[locale]/opportunities/[slug]/page.tsx");
  assert.match(opportunities, /application_deadline:[\s\S]*opportunity\.application_deadline\?\.trim\(\)[\s\S]*opportunity\.deadline\?\.trim\(\)[\s\S]*opportunity\.expires_at\?\.trim\(\)/);
  assert.match(detailPage, /opportunity\.application_deadline\s*\|\|\s*opportunity\.deadline/);
  assert.match(detailPage, /validThrough:/);
});

test("sitemap only publishes active opportunity inventory for the currently indexable Saudi market", () => {
  const sitemap = source("app/sitemap.ts");
  assert.match(sitemap, /const SEO_MARKET = "SA" as const/);
  assert.match(sitemap, /activeOpportunities = opportunities\.filter/);
  assert.match(sitemap, /isOpportunityOpenForSeo\(opportunity\)/);
  assert.match(sitemap, /const opportunityRoutes:[\s\S]*activeOpportunities/);
  assert.match(sitemap, /const opportunityTypes = new Set\(activeOpportunities/);
});
