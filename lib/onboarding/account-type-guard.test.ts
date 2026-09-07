import { describe, expect, it } from "vitest";

import { hasPublisherIntentConfirmation } from "./account-type-guard";

describe("publisher onboarding intent guard", () => {
  it("requires explicit publisher confirmation", () => {
    expect(hasPublisherIntentConfirmation(undefined)).toBe(false);
    expect(hasPublisherIntentConfirmation(null)).toBe(false);
    expect(hasPublisherIntentConfirmation("no")).toBe(false);
    expect(hasPublisherIntentConfirmation("yes")).toBe(true);
  });
});
