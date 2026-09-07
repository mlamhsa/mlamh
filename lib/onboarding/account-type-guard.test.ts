import { describe, expect, it } from "vitest";

function canSelectPublisher(intent: string | null | undefined) {
  return intent === "yes";
}

describe("publisher onboarding intent guard", () => {
  it("requires explicit publisher confirmation", () => {
    expect(canSelectPublisher(undefined)).toBe(false);
    expect(canSelectPublisher("no")).toBe(false);
    expect(canSelectPublisher("yes")).toBe(true);
  });
});
