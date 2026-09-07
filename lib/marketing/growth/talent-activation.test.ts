import test from "node:test";
import assert from "node:assert/strict";

import { buildTalentActivationFunnel, talentActivationSummary } from "@/lib/marketing/growth/talent-activation";

test("talent activation funnel calculates step conversion and largest drop-off", () => {
  const snapshot = { registrations: 100, completed: 60, submitted: 48, approved: 36, applications: 24 };
  const funnel = buildTalentActivationFunnel(snapshot);
  assert.deepEqual(funnel.map((step) => step.conversionFromPrevious), [null, 60, 80, 75, 67]);
  const summary = talentActivationSummary(snapshot);
  assert.equal(summary.completionRate, 60);
  assert.equal(summary.submissionRate, 80);
  assert.equal(summary.approvalRate, 75);
  assert.equal(summary.approvalActivation, 36);
  assert.equal(summary.biggestBottleneck?.key, "completed");
  assert.equal(summary.biggestBottleneck?.dropoffFromPrevious, 40);
});

test("talent activation diagnostics do not invent percentages without a denominator", () => {
  const snapshot = { registrations: 0, completed: 0, submitted: 0, approved: 0, applications: 0 };
  const funnel = buildTalentActivationFunnel(snapshot);
  assert.deepEqual(funnel.map((step) => step.conversionFromPrevious), [null, null, null, null, null]);
  const summary = talentActivationSummary(snapshot);
  assert.equal(summary.approvalActivation, 0);
  assert.equal(summary.biggestBottleneck, null);
});

test("drop-off is clamped when activity counts exceed a previous funnel count", () => {
  const snapshot = { registrations: 10, completed: 8, submitted: 7, approved: 6, applications: 20 };
  const funnel = buildTalentActivationFunnel(snapshot);
  assert.equal(funnel.at(-1)?.conversionFromPrevious, 333);
  assert.equal(funnel.at(-1)?.dropoffFromPrevious, 0);
});
