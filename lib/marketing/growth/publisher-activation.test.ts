import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPublisherActivationFunnel,
  publisherActivationSummary,
} from "@/lib/marketing/growth/publisher-activation";

test("publisher activation funnel calculates governed account progression", () => {
  const snapshot = {
    registrations: 100,
    profiles: 80,
    submitted: 60,
    approved: 45,
    opportunityPublishers: 18,
  };

  const funnel = buildPublisherActivationFunnel(snapshot);
  assert.deepEqual(
    funnel.map((step) => step.conversionFromPrevious),
    [null, 80, 75, 75],
  );

  const summary = publisherActivationSummary(snapshot);
  assert.equal(summary.profileRate, 80);
  assert.equal(summary.submissionRate, 75);
  assert.equal(summary.approvalRate, 75);
  assert.equal(summary.approvalActivation, 45);
  assert.equal(summary.opportunityActivation, 40);
  assert.equal(summary.biggestBottleneck?.key, "profiles");
});

test("publisher activation diagnostics avoid fabricated rates without denominators", () => {
  const snapshot = {
    registrations: 0,
    profiles: 0,
    submitted: 0,
    approved: 0,
    opportunityPublishers: 0,
  };

  const funnel = buildPublisherActivationFunnel(snapshot);
  assert.deepEqual(
    funnel.map((step) => step.conversionFromPrevious),
    [null, null, null, null],
  );

  const summary = publisherActivationSummary(snapshot);
  assert.equal(summary.approvalActivation, 0);
  assert.equal(summary.opportunityActivation, 0);
  assert.equal(summary.biggestBottleneck, null);
});

test("publisher opportunity activation is activity evidence, not a funnel step", () => {
  const snapshot = {
    registrations: 10,
    profiles: 10,
    submitted: 8,
    approved: 4,
    opportunityPublishers: 6,
  };

  const summary = publisherActivationSummary(snapshot);
  assert.equal(summary.opportunityActivation, 150);
  assert.equal(buildPublisherActivationFunnel(snapshot).length, 4);
});
