import assert from "node:assert/strict";
import test from "node:test";

import { buildTalentSupplyCoverageSnapshot } from "./coverage.ts";

test("inactive markets never receive live talent supply coverage", () => {
  const snapshot = buildTalentSupplyCoverageSnapshot({
    operational: false,
    talents: [{ role: "actor", city: "riyadh" }],
    demand: [{ projectId: 1, role: "actor", city: "riyadh", requiredCount: 2, status: "active" }],
  });

  assert.equal(snapshot.operational, false);
  assert.equal(snapshot.qualifiedTalentCount, 0);
  assert.deepEqual(snapshot.segments, []);
});

test("role and city coverage is deterministic and does not claim exact matching", () => {
  const snapshot = buildTalentSupplyCoverageSnapshot({
    operational: true,
    talents: [
      { role: "actor", city: "Riyadh" },
      { role: "actor", city: "riyadh" },
      { role: "model", city: "Jeddah" },
    ],
    demand: [
      { projectId: 10, role: "actor", city: "riyadh", requiredCount: 3, status: "active" },
      { projectId: 11, role: "model", city: "jeddah", requiredCount: 1, status: "screening" },
    ],
  });

  assert.equal(snapshot.exactMatching, false);
  assert.equal(snapshot.interpretation, "baseline_role_city_coverage");
  assert.equal(snapshot.qualifiedTalentCount, 3);
  assert.equal(snapshot.openDemandCount, 4);
  assert.equal(snapshot.openProjectCount, 2);

  const actorRiyadh = snapshot.segments.find(
    (segment) => segment.role === "actor" && segment.city === "riyadh",
  );
  assert.deepEqual(actorRiyadh, {
    role: "actor",
    city: "riyadh",
    qualifiedSupply: 2,
    pipelineDemand: 3,
    openProjects: 1,
    pressureRatio: 1.5,
    status: "constrained",
  });

  const modelJeddah = snapshot.segments.find(
    (segment) => segment.role === "model" && segment.city === "jeddah",
  );
  assert.equal(modelJeddah?.status, "covered");
});

test("missing supply and missing dimensions remain explicit", () => {
  const snapshot = buildTalentSupplyCoverageSnapshot({
    operational: true,
    talents: [{ role: "actor", city: "riyadh" }],
    demand: [
      { projectId: 20, role: "model", city: "jeddah", requiredCount: 2, status: "active" },
      { projectId: 21, role: "actor", city: null, requiredCount: 1, status: "new" },
    ],
  });

  assert.equal(snapshot.segments[0]?.status, "no_supply");
  assert.ok(snapshot.segments.some((segment) => segment.status === "insufficient_data"));
});
