import { describe, expect, it } from "vitest";

import { isSafeInternalMarketingTask } from "@/lib/marketing/tasks/safe-internal";

describe("safe internal marketing task eligibility", () => {
  it("allows autonomous internal tasks explicitly marked non-external", () => {
    expect(isSafeInternalMarketingTask({
      source: "autonomous_orchestrator",
      channel: "internal",
      metadata: { external_execution: false },
    })).toBe(true);
  });

  it("rejects external channels even when marked non-external", () => {
    expect(isSafeInternalMarketingTask({
      source: "autonomous_orchestrator",
      channel: "email",
      metadata: { external_execution: false },
    })).toBe(false);
  });

  it("rejects tasks without the explicit non-external marker", () => {
    expect(isSafeInternalMarketingTask({
      source: "autonomous_orchestrator",
      channel: "internal",
      metadata: {},
    })).toBe(false);
  });

  it("rejects non-orchestrator tasks", () => {
    expect(isSafeInternalMarketingTask({
      source: "admin",
      channel: "internal",
      metadata: { external_execution: false },
    })).toBe(false);
  });
});
