import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAllIntelligenceMarketContexts,
  buildIntelligenceMarketContext,
} from "./context.ts";
import { buildExecutiveBrief } from "../executive/brief.ts";

test("Saudi Arabia is the only operational intelligence market", () => {
  const markets = buildAllIntelligenceMarketContexts();
  const active = markets.filter((market) => market.isOperational);

  assert.equal(active.length, 1);
  assert.equal(active[0]?.countryCode, "SA");
  assert.equal(active[0]?.operationalStatus, "active");
});

test("configured non-Saudi markets remain not activated", () => {
  for (const countryCode of ["AE", "EG", "MA", "QA", "JO", "LB", "KW"] as const) {
    const market = buildIntelligenceMarketContext(countryCode);
    assert.equal(market.isOperational, false);
    assert.equal(market.operationalStatus, "not_activated");
  }
});

test("intelligence context reuses market feature flags", () => {
  const sa = buildIntelligenceMarketContext("SA");
  const ae = buildIntelligenceMarketContext("AE");

  assert.equal(sa.capabilities.applications, true);
  assert.equal(sa.capabilities.payments, true);
  assert.equal(ae.capabilities.applications, false);
  assert.equal(ae.capabilities.payments, false);
});

test("executive brief derives loop metrics without inventing unavailable rates", () => {
  const brief = buildExecutiveBrief(
    {
      talentProfiles: 20,
      qualifiedTalents: 10,
      publishers: 3,
      publishedOpportunities: 0,
      applications: 0,
      acceptedApplications: 0,
      activeConversations: 0,
    },
    "2026-09-06T08:00:00.000Z",
  );

  const qualifiedRate = brief.metrics.find((metric) => metric.key === "qualified_talent_rate");
  const applicationsPerOpportunity = brief.metrics.find(
    (metric) => metric.key === "applications_per_opportunity",
  );

  assert.equal(qualifiedRate?.value, 50);
  assert.equal(applicationsPerOpportunity?.value, null);
  assert.equal(brief.operatingLoop.complete, false);
  assert.equal(brief.priorities[0]?.key, "restore_live_demand");
});

test("executive brief marks the core loop complete only when every stage is present", () => {
  const brief = buildExecutiveBrief({
    talentProfiles: 40,
    qualifiedTalents: 30,
    publishers: 5,
    publishedOpportunities: 4,
    applications: 20,
    acceptedApplications: 5,
    activeConversations: 3,
  });

  assert.equal(brief.operatingLoop.complete, true);
  assert.equal(brief.priorities.at(-1)?.key, "operating_loop_active");
  assert.equal(
    brief.metrics.find((metric) => metric.key === "application_acceptance_rate")?.value,
    25,
  );
  assert.equal(
    brief.metrics.find((metric) => metric.key === "applications_per_opportunity")?.value,
    5,
  );
});
