import test from "node:test";
import assert from "node:assert/strict";

import { deriveMarketHealth } from "./health.ts";

test("inactive markets never receive a live health score", () => {
  const health = deriveMarketHealth({
    operational: false,
    talents: 100,
    publishers: 20,
    opportunities: 10,
    applications: 50,
    acceptedApplications: 8,
    connections: 4,
  });

  assert.equal(health.available, false);
  assert.equal(health.state, "not_applicable");
  assert.equal(health.score, null);
});

test("full observable loop produces a healthy deterministic market state", () => {
  const health = deriveMarketHealth({
    operational: true,
    talents: 10,
    publishers: 2,
    opportunities: 3,
    applications: 8,
    acceptedApplications: 2,
    connections: 1,
  });

  assert.equal(health.available, true);
  assert.equal(health.score, 100);
  assert.equal(health.state, "healthy");
  assert.equal(health.components.connectionFlow, true);
});

test("partial loop remains developing without inventing downstream activity", () => {
  const health = deriveMarketHealth({
    operational: true,
    talents: 8,
    publishers: 1,
    opportunities: 2,
    applications: 0,
    acceptedApplications: 0,
    connections: 0,
  });

  assert.equal(health.score, 50);
  assert.equal(health.state, "developing");
  assert.equal(health.components.applicationFlow, false);
  assert.equal(health.components.selectionFlow, false);
  assert.equal(health.components.connectionFlow, false);
});

test("empty active market is cold and zero-safe", () => {
  const health = deriveMarketHealth({
    operational: true,
    talents: 0,
    publishers: 0,
    opportunities: 0,
    applications: 0,
    acceptedApplications: 0,
    connections: 0,
  });

  assert.equal(health.score, 0);
  assert.equal(health.state, "cold");
});
