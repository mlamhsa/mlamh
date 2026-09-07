import test from "node:test";
import assert from "node:assert/strict";

import {
  buildOpportunityJobPosting,
  getOpportunityCountryCode,
  getOpportunityCurrency,
  getOpportunityDeadline,
  isOpportunityOpenForSeo,
  shouldRenderJobPosting,
} from "./opportunity.ts";

test("opportunity SEO uses explicit market country and currency with safe Saudi fallback", () => {
  assert.equal(getOpportunityCountryCode("AE"), "AE");
  assert.equal(getOpportunityCountryCode("xx"), "SA");
  assert.equal(getOpportunityCurrency({ id: 1, country_code: "AE" }), "AED");
  assert.equal(getOpportunityCurrency({ id: 1, country_code: "SA", currency: "sar" }), "SAR");
});

test("deadline resolution covers current and legacy opportunity expiry fields", () => {
  assert.equal(getOpportunityDeadline({ id: 1, application_deadline: "2026-10-01", expires_at: "2026-09-01" }), "2026-10-01");
  assert.equal(getOpportunityDeadline({ id: 1, deadline: "2026-09-20", expires_at: "2026-09-01" }), "2026-09-20");
  assert.equal(getOpportunityDeadline({ id: 1, expires_at: "2026-09-01T12:00:00Z" }), "2026-09-01T12:00:00Z");
});

test("expired opportunities stay accessible as pages but no longer qualify for active JobPosting markup", () => {
  const record = { id: 1, status: "published", compensation_type: "fixed", application_deadline: "2026-09-01" };
  const now = new Date("2026-09-07T12:00:00Z");
  assert.equal(isOpportunityOpenForSeo(record, now), false);
  assert.equal(shouldRenderJobPosting(record, now), false);
});

test("unpaid opportunities do not emit JobPosting markup", () => {
  assert.equal(shouldRenderJobPosting({ id: 1, status: "published", compensation_type: "unpaid" }, new Date("2026-09-07T12:00:00Z")), false);
});

test("JobPosting uses record country instead of hard-coded Saudi Arabia", () => {
  const schema = buildOpportunityJobPosting({
    record: {
      id: 7,
      slug: "model-dubai",
      title: "Model opportunity",
      description: "Campaign casting",
      status: "published",
      country_code: "AE",
      city_en: "Dubai",
      company_name: "Example Studio",
      compensation_type: "negotiable",
      created_at: "2026-09-07T08:00:00Z",
      application_deadline: "2026-09-20",
    },
    canonicalUrl: "https://mlamh.net/en/opportunities/model-dubai",
    locale: "en",
  });

  assert.equal(schema.jobLocation?.address.addressCountry, "AE");
  assert.equal(schema.jobLocation?.address.addressLocality, "Dubai");
  assert.equal(schema.hiringOrganization?.name, "Example Studio");
  assert.equal(schema.validThrough, "2026-09-20T23:59:59");
  assert.equal("baseSalary" in schema && Boolean(schema.baseSalary), false);
});
