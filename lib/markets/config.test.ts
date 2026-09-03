import test from "node:test";
import assert from "node:assert/strict";

import {
  getMarketConfig,
  isMarketFeatureEnabled,
  resolveMarketCurrency,
} from "./config.ts";

const gatedFeatures = [
  "talentRegistration",
  "publisherRegistration",
  "opportunityCreation",
  "applications",
  "publicTalentDirectory",
  "publicOpportunities",
  "search",
  "payments",
  "seoIndexing",
] as const;

test("Saudi Arabia is the only active market", () => {
  assert.equal(getMarketConfig("SA").status, "active");
  for (const feature of gatedFeatures) {
    assert.equal(isMarketFeatureEnabled("SA", feature), true);
  }
});

test("prepared GCC and MENA markets remain disabled", () => {
  for (const country of ["AE", "EG", "MA", "QA"] as const) {
    assert.equal(getMarketConfig(country).status, "prepared");
    for (const feature of gatedFeatures) {
      assert.equal(isMarketFeatureEnabled(country, feature), false);
    }
  }
});

test("future markets remain disabled", () => {
  for (const country of ["JO", "LB", "KW"] as const) {
    assert.equal(getMarketConfig(country).status, "future");
    for (const feature of gatedFeatures) {
      assert.equal(isMarketFeatureEnabled(country, feature), false);
    }
  }
});

test("market currency resolution is country-aware without activating payments", () => {
  assert.equal(resolveMarketCurrency("SA"), "SAR");
  assert.equal(resolveMarketCurrency("AE"), "AED");
  assert.equal(resolveMarketCurrency("QA"), "QAR");
  assert.equal(isMarketFeatureEnabled("AE", "payments"), false);
  assert.equal(isMarketFeatureEnabled("QA", "payments"), false);
});
