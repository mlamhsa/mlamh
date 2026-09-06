import test from "node:test";
import assert from "node:assert/strict";

import {
  INTELLIGENCE_EXECUTION_MODE,
  getCapabilityRiskClass,
  isCapabilityAllowedInShadowMode,
} from "./risk.ts";

test("intelligence starts in shadow mode", () => {
  assert.equal(INTELLIGENCE_EXECUTION_MODE, "shadow");
});

test("read and analysis capabilities are allowed in shadow mode", () => {
  for (const capability of ["read", "analyze", "score", "rank", "recommend", "draft"] as const) {
    assert.equal(getCapabilityRiskClass(capability), "green");
    assert.equal(isCapabilityAllowedInShadowMode(capability), true);
  }
});

test("external and core-mutating capabilities are denied in shadow mode", () => {
  for (const capability of ["publish", "send", "approve", "reject", "pay", "delete", "mutate_core"] as const) {
    assert.equal(isCapabilityAllowedInShadowMode(capability), false);
  }

  assert.equal(getCapabilityRiskClass("publish"), "amber");
  assert.equal(getCapabilityRiskClass("send"), "amber");
  assert.equal(getCapabilityRiskClass("mutate_core"), "red");
});
