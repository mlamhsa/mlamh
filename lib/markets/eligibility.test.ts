import test from "node:test";
import assert from "node:assert/strict";

import { evaluateTalentMarketEligibility } from "./eligibility.ts";

test("talent is eligible in the base market", () => {
  assert.deepEqual(
    evaluateTalentMarketEligibility({ baseCountryCode: "AE" }, "AE"),
    { eligible: true, reason: "base_market" },
  );
});

test("talent can be eligible for a different explicit work market", () => {
  assert.deepEqual(
    evaluateTalentMarketEligibility(
      { baseCountryCode: "AE", workMarketCodes: ["SA", "QA"] },
      "SA",
    ),
    { eligible: true, reason: "work_market" },
  );
});

test("national location alone does not make talent eligible for another market", () => {
  assert.deepEqual(
    evaluateTalentMarketEligibility({ baseCountryCode: "MA" }, "SA"),
    { eligible: false, reason: "market_mismatch" },
  );
});

test("legacy talent without country data falls back to Saudi only", () => {
  assert.deepEqual(
    evaluateTalentMarketEligibility({}, "SA"),
    { eligible: true, reason: "legacy_sa" },
  );
  assert.deepEqual(
    evaluateTalentMarketEligibility({}, "AE"),
    { eligible: false, reason: "market_mismatch" },
  );
});
