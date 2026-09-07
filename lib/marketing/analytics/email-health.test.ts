import { describe, expect, it } from "vitest";

import { evaluateEmailHealth } from "./email-health";

const now = Date.parse("2026-09-07T06:00:00Z");

function base(overrides: Partial<Parameters<typeof evaluateEmailHealth>[0]> = {}) {
  return {
    published: 10,
    humanInbound: 2,
    bounces: 0,
    followUpsDue: 0,
    pendingFollowUpTasks: 0,
    emailProductionEnabled: true,
    integrationStatus: "connected",
    lastSuccessAt: "2026-09-07T03:00:00Z",
    nowMs: now,
    ...overrides,
  };
}

describe("email health guard", () => {
  it("keeps a healthy observed channel normal", () => {
    const result = evaluateEmailHealth(base());
    expect(result.level).toBe("ok");
    expect(result.guardState).toBe("normal");
    expect(result.enforced).toBe(false);
  });

  it("recommends holding new outreach when the live integration is stale", () => {
    const result = evaluateEmailHealth(base({ lastSuccessAt: "2026-09-06T20:00:00Z" }));
    expect(result.level).toBe("critical");
    expect(result.guardState).toBe("hold_new_outreach");
    expect(result.alerts.some((alert) => alert.code === "integration_stale")).toBe(true);
  });

  it("prioritizes high bounce rate as a critical deliverability alert", () => {
    const result = evaluateEmailHealth(base({ published: 20, humanInbound: 5, bounces: 3 }));
    expect(result.level).toBe("critical");
    expect(result.alerts.some((alert) => alert.code === "bounce_rate_high")).toBe(true);
  });

  it("requires review when governed follow-ups are waiting", () => {
    const result = evaluateEmailHealth(base({ pendingFollowUpTasks: 1 }));
    expect(result.level).toBe("warning");
    expect(result.guardState).toBe("review_required");
  });

  it("only observes when the sample is too small", () => {
    const result = evaluateEmailHealth(base({ published: 2, humanInbound: 1 }));
    expect(result.level).toBe("observe");
    expect(result.guardState).toBe("observe");
    expect(result.alerts.some((alert) => alert.code === "insufficient_sample")).toBe(true);
  });
});
