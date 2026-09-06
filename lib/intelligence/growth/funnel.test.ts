import assert from "node:assert/strict";
import test from "node:test";

import { deriveGrowthFunnel } from "./funnel.ts";

test("marks sparse attribution as insufficient data", () => {
  const result = deriveGrowthFunnel({ visits: 20, registrations: 5, applications: 2, briefs: 0 });
  assert.equal(result.state, "insufficient_data");
  assert.equal(result.registrationRate, 25);
  assert.equal(result.deterministic, true);
});

test("detects registration and activation leaks deterministically", () => {
  const registrationLeak = deriveGrowthFunnel({ visits: 100, registrations: 5, applications: 2, briefs: 1 });
  assert.equal(registrationLeak.state, "registration_leak");

  const activationLeak = deriveGrowthFunnel({ visits: 100, registrations: 20, applications: 4, briefs: 1 });
  assert.equal(activationLeak.state, "activation_leak");
});

test("detects demand gap and healthy flow without fabricated rates", () => {
  const demandGap = deriveGrowthFunnel({ visits: 100, registrations: 20, applications: 10, briefs: 0 });
  assert.equal(demandGap.state, "demand_gap");
  assert.equal(demandGap.briefRate, 0);

  const healthy = deriveGrowthFunnel({ visits: 100, registrations: 20, applications: 10, briefs: 3 });
  assert.equal(healthy.state, "healthy");
  assert.equal(healthy.applicationActivationRate, 50);

  const noVisits = deriveGrowthFunnel({ visits: 0, registrations: 0, applications: 0, briefs: 0 });
  assert.equal(noVisits.registrationRate, null);
  assert.equal(noVisits.briefRate, null);
});
