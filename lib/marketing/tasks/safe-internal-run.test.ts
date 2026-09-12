import { describe, expect, it } from "vitest";

function isSafeInternalTask(task: {
  source: string | null;
  channel: string | null;
  metadata: unknown;
}) {
  const metadata = task.metadata && typeof task.metadata === "object" && !Array.isArray(task.metadata)
    ? task.metadata as Record<string, unknown>
    : {};
  return task.source === "autonomous_orchestrator"
    && task.channel === "internal"
    && metadata.external_execution === false;
}

describe("safe internal marketing task eligibility", () => {
  it("allows autonomous internal tasks explicitly marked non-external", () => {
    expect(isSafeInternalTask({ source: "autonomous_orchestrator", channel: "internal", metadata: { external_execution: false } })).toBe(true);
  });

  it("rejects email and tasks without the explicit non-external marker", () => {
    expect(isSafeInternalTask({ source: "autonomous_orchestrator", channel: "email", metadata: { external_execution: false } })).toBe(false);
    expect(isSafeInternalTask({ source: "autonomous_orchestrator", channel: "internal", metadata: {} })).toBe(false);
  });
});
