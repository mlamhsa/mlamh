import { describe, expect, it } from "vitest";

import { diagnoseEmailFeedback } from "./email-feedback";

describe("email analytics feedback", () => {
  it("avoids strong conclusions on tiny samples", () => {
    expect(diagnoseEmailFeedback({ published: 4, humanInbound: 0, bounces: 0, followUpsDue: 0 }))
      .toBe("insufficient_sample");
  });

  it("flags deliverability before messaging optimization", () => {
    expect(diagnoseEmailFeedback({ published: 20, humanInbound: 5, bounces: 3, followUpsDue: 0 }))
      .toBe("deliverability_attention");
  });

  it("flags low observed replies only with a usable sample", () => {
    expect(diagnoseEmailFeedback({ published: 20, humanInbound: 1, bounces: 0, followUpsDue: 0 }))
      .toBe("messaging_or_targeting_attention");
  });

  it("surfaces governed follow-ups when the basic signals are healthy", () => {
    expect(diagnoseEmailFeedback({ published: 10, humanInbound: 3, bounces: 0, followUpsDue: 2 }))
      .toBe("review_followups");
  });
});
