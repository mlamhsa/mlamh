import assert from "node:assert/strict";
import test from "node:test";

import { evaluateControlledExecution } from "./controlled-execution";

const testMode = {
  enabled: true,
  emailAllowlist: ["hello@mlamh.net", "qa@mlamh.net"],
  bufferTargets: ["instagram", "facebook"] as Array<"instagram" | "facebook">,
};

test("production execution bypasses sandbox allowlists only when the global gate is enabled", () => {
  assert.deepEqual(evaluateControlledExecution({
    channel: "email",
    productionEnabled: true,
    testModeRequested: false,
    testMode: { enabled: false, emailAllowlist: [], bufferTargets: [] },
    recipientEmail: "client@example.com",
  }), { allowed: true, mode: "production" });
});

test("global execution off blocks ordinary external jobs", () => {
  assert.deepEqual(evaluateControlledExecution({
    channel: "buffer",
    productionEnabled: false,
    testModeRequested: false,
    testMode,
    bufferTarget: "instagram",
  }), { allowed: false, reason: "external_execution_disabled" });
});

test("test email must be explicitly marked and allowlisted", () => {
  assert.deepEqual(evaluateControlledExecution({
    channel: "email",
    productionEnabled: false,
    testModeRequested: true,
    testMode,
    recipientEmail: "HELLO@MLAMH.NET",
  }), { allowed: true, mode: "test" });

  assert.deepEqual(evaluateControlledExecution({
    channel: "email",
    productionEnabled: false,
    testModeRequested: true,
    testMode,
    recipientEmail: "client@example.com",
  }), { allowed: false, reason: "test_email_recipient_not_allowlisted" });
});

test("test Buffer publishing is limited to allowlisted MLAMH targets", () => {
  assert.deepEqual(evaluateControlledExecution({
    channel: "buffer",
    productionEnabled: false,
    testModeRequested: true,
    testMode,
    bufferTarget: "instagram",
  }), { allowed: true, mode: "test" });

  assert.deepEqual(evaluateControlledExecution({
    channel: "buffer",
    productionEnabled: false,
    testModeRequested: true,
    testMode: { ...testMode, bufferTargets: ["instagram"] },
    bufferTarget: "facebook",
  }), { allowed: false, reason: "test_buffer_target_not_allowlisted" });
});

test("disabled sandbox never overrides the global kill switch", () => {
  assert.deepEqual(evaluateControlledExecution({
    channel: "email",
    productionEnabled: false,
    testModeRequested: true,
    testMode: { enabled: false, emailAllowlist: ["hello@mlamh.net"], bufferTargets: ["instagram"] },
    recipientEmail: "hello@mlamh.net",
  }), { allowed: false, reason: "test_mode_disabled" });
});
