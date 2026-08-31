import test from "node:test";
import assert from "node:assert/strict";
import { bufferTargetsFromValues, evaluateChannelExecutionPolicy } from "./execution-policy.ts";

const valid = {
  jobStatus: "approved",
  approvalId: 10,
  approvalStatus: "approved",
  approvalTaskMatches: true,
  externalExecutionEnabled: true,
  idempotencyKey: "job-10-instagram",
  externalPostId: null,
  mode: "publish_now" as const,
  scheduledAt: null,
};

test("execution without approval is rejected", () => assert.deepEqual(evaluateChannelExecutionPolicy({ ...valid, approvalId: null, approvalStatus: null }), { allowed: false, reason: "missing_approval" }));
test("rejected approval cannot execute", () => assert.deepEqual(evaluateChannelExecutionPolicy({ ...valid, approvalStatus: "rejected" }), { allowed: false, reason: "invalid_approval" }));
test("cancelled approval cannot execute", () => assert.deepEqual(evaluateChannelExecutionPolicy({ ...valid, approvalStatus: "cancelled" }), { allowed: false, reason: "invalid_approval" }));
test("kill switch off blocks execution", () => assert.deepEqual(evaluateChannelExecutionPolicy({ ...valid, externalExecutionEnabled: false }), { allowed: false, reason: "external_execution_disabled" }));
test("published external id is idempotent and does not republish", () => assert.deepEqual(evaluateChannelExecutionPolicy({ ...valid, jobStatus: "failed", externalPostId: "buffer-post-1" }), { allowed: true, duplicate: true }));
test("schedule and publish now are separate", () => {
  assert.deepEqual(evaluateChannelExecutionPolicy({ ...valid, mode: "schedule", jobStatus: "scheduled", approvalStatus: "scheduled", scheduledAt: "2026-09-01T12:00:00Z" }), { allowed: true, duplicate: false });
  assert.deepEqual(evaluateChannelExecutionPolicy({ ...valid, mode: "publish_now", jobStatus: "scheduled", approvalStatus: "scheduled", scheduledAt: "2026-09-01T12:00:00Z" }), { allowed: false, reason: "publish_now_not_approved" });
});
test("Instagram only creates one target", () => assert.deepEqual(bufferTargetsFromValues(["instagram"]), ["instagram"]));
test("Facebook only creates one target", () => assert.deepEqual(bufferTargetsFromValues(["facebook"]), ["facebook"]));
test("both targets stay independent", () => assert.deepEqual(bufferTargetsFromValues(["instagram", "facebook"]), ["instagram", "facebook"]));
test("duplicate target clicks are deduplicated", () => assert.deepEqual(bufferTargetsFromValues(["instagram", "instagram", "facebook"]), ["instagram", "facebook"]));
