import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAllIntelligenceMarketContexts,
  buildIntelligenceMarketContext,
} from "./context.ts";

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
