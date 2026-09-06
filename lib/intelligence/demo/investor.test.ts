import test from "node:test";
import assert from "node:assert/strict";

import { buildInvestorDemoSnapshotFromInputs } from "./investor.ts";
import { buildExecutiveBrief } from "../executive/brief.ts";

test("investor demo sanitizes project and role identity while preserving deterministic counts", () => {
  const executive = buildExecutiveBrief({
    talentProfiles: 20,
    qualifiedTalents: 10,
    publishers: 3,
    publishedOpportunities: 4,
    applications: 8,
    acceptedApplications: 2,
    activeConversations: 1,
  }, "2026-09-06T08:00:00.000Z");

  const snapshot = buildInvestorDemoSnapshotFromInputs({
    generatedAt: "2026-09-06T08:00:00.000Z",
    executive,
    casting: {
      market: "SA",
      project: {
        id: 42,
        project_title: "Private Client Campaign",
        talent_type: "actor",
        required_count: 5,
        city: "Riyadh",
      },
      roles: [
        {
          roleId: 7,
          title: "Private Lead Role",
          needed: 5,
          qualified: 14,
          sendable: 3,
          missing: 2,
          blockerCounts: [
            { reason: "city_mismatch", count: 6 },
            { reason: "missing_image", count: 4 },
          ],
          gap: { needed: 5, available: 3, missing: 2, reasons: ["city_mismatch"] },
          signal: null,
          recommendation: null,
        },
      ],
    },
  });

  assert.equal(snapshot.mode, "investor_demo");
  assert.equal(snapshot.readOnly, true);
  assert.equal(snapshot.sanitized, true);
  assert.equal(snapshot.scenario?.label, "Casting Scenario #42");
  assert.equal(snapshot.scenario?.roles[0]?.label, "Role 1");
  assert.equal(snapshot.scenario?.totalNeeded, 5);
  assert.equal(snapshot.scenario?.totalSendable, 3);
  assert.equal(snapshot.scenario?.totalMissing, 2);
  assert.equal(snapshot.scenario?.status, "supply_gap");
  assert.equal(snapshot.proof.externalExecution, false);
  assert.equal(snapshot.proof.coreWrites, false);
  assert.equal(JSON.stringify(snapshot).includes("Private Client Campaign"), false);
  assert.equal(JSON.stringify(snapshot).includes("Private Lead Role"), false);
});

test("investor demo remains truthful when no casting scenario exists", () => {
  const executive = buildExecutiveBrief({
    talentProfiles: 0,
    qualifiedTalents: 0,
    publishers: 0,
    publishedOpportunities: 0,
    applications: 0,
    acceptedApplications: 0,
    activeConversations: 0,
  }, "2026-09-06T08:00:00.000Z");

  const snapshot = buildInvestorDemoSnapshotFromInputs({
    generatedAt: "2026-09-06T08:00:00.000Z",
    executive,
    casting: null,
  });

  assert.equal(snapshot.scenario, null);
  assert.equal(snapshot.executive.metrics.every((metric) => metric.value === null), true);
});
