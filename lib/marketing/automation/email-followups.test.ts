import { describe, expect, it } from "vitest";

import { buildEmailFollowUpDraft, isEmailFollowUpDue } from "./email-followups";

describe("email follow-up automation", () => {
  it("requires the prior message to opt into follow-up", () => {
    const now = new Date("2026-09-10T08:00:00+03:00");
    expect(isEmailFollowUpDue({
      publishedAt: "2026-09-07T08:00:00+03:00",
      now,
      followUpNeeded: false,
    })).toBe(false);
  });

  it("waits at least 72 hours", () => {
    const now = new Date("2026-09-10T08:00:01+03:00");
    expect(isEmailFollowUpDue({
      publishedAt: "2026-09-07T08:00:00+03:00",
      now,
      followUpNeeded: true,
    })).toBe(true);
    expect(isEmailFollowUpDue({
      publishedAt: "2026-09-08T08:00:00+03:00",
      now,
      followUpNeeded: true,
    })).toBe(false);
  });

  it("keeps the deterministic follow-up concise and language-aware", () => {
    expect(buildEmailFollowUpDraft("مرحبًا، نحتاج تفاصيل الموعد")).toContain("متابعة سريعة");
    expect(buildEmailFollowUpDraft("Hello, please confirm the date")).toContain("A quick follow-up");
  });
});
