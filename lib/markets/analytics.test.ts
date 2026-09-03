import test from "node:test";
import assert from "node:assert/strict";

import { buildMarketAnalyticsSnapshot } from "./analytics.ts";

const input = {
  talents: [
    {},
    { base_country_code: "SA" as const },
    { base_country_code: "AE" as const },
  ],
  publishers: [
    {},
    { country_code: "AE" as const },
  ],
  opportunities: [
    {},
    { country_code: "SA" as const },
    { country_code: "AE" as const },
  ],
  applications: [
    {},
    { opportunity_country_code: "SA" as const },
    { opportunity_country_code: "AE" as const },
  ],
  acceptedApplications: [
    { opportunity_country_code: "SA" as const },
    { opportunity_country_code: "AE" as const },
  ],
  connections: [
    { opportunity_country_code: "SA" as const },
  ],
};

test("legacy analytics records belong to Saudi during the compatibility window", () => {
  const snapshot = buildMarketAnalyticsSnapshot("SA", input);

  assert.equal(snapshot.talents, 2);
  assert.equal(snapshot.publishers, 1);
  assert.equal(snapshot.opportunities, 2);
  assert.equal(snapshot.applications, 2);
  assert.equal(snapshot.acceptedApplications, 1);
  assert.equal(snapshot.connections, 1);
  assert.equal(snapshot.applicationAcceptanceRate, 50);
  assert.equal(snapshot.opportunityConnectionRate, 50);
});

test("explicit UAE records stay isolated from Saudi analytics", () => {
  const snapshot = buildMarketAnalyticsSnapshot("AE", input);

  assert.equal(snapshot.talents, 1);
  assert.equal(snapshot.publishers, 1);
  assert.equal(snapshot.opportunities, 1);
  assert.equal(snapshot.applications, 1);
  assert.equal(snapshot.acceptedApplications, 1);
  assert.equal(snapshot.connections, 0);
  assert.equal(snapshot.applicationAcceptanceRate, 100);
  assert.equal(snapshot.opportunityConnectionRate, 0);
});

test("empty markets return zero-safe conversion rates", () => {
  const snapshot = buildMarketAnalyticsSnapshot("QA", input);

  assert.equal(snapshot.talents, 0);
  assert.equal(snapshot.opportunities, 0);
  assert.equal(snapshot.applications, 0);
  assert.equal(snapshot.applicationAcceptanceRate, 0);
  assert.equal(snapshot.opportunityConnectionRate, 0);
});
