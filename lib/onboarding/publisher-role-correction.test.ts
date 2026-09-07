import { describe, expect, it } from "vitest";

import { assessPublisherRoleMismatch } from "./publisher-role-correction";

describe("publisher role correction assessment", () => {
  it("flags likely talent registered as an individual publisher", () => {
    const result = assessPublisherRoleMismatch({
      publisherType: "individual",
      companyName: null,
      description: "أبحث عن فرصة في مجال التمثيل كممثل",
      totalOpportunities: 0,
      verificationStatus: "unverified",
    });

    expect(result.likelyTalentMismatch).toBe(true);
    expect(result.correctionEligible).toBe(true);
  });

  it("does not auto-flag a normal individual publisher", () => {
    const result = assessPublisherRoleMismatch({
      publisherType: "individual",
      companyName: null,
      description: "أبحث عن ممثلين لتصوير إعلان",
      totalOpportunities: 2,
      verificationStatus: "unverified",
    });

    expect(result.correctionEligible).toBe(false);
  });

  it("blocks correction when publisher has opportunities", () => {
    const result = assessPublisherRoleMismatch({
      publisherType: "individual",
      companyName: null,
      description: "actor looking for acting opportunities",
      totalOpportunities: 1,
      verificationStatus: "unverified",
    });

    expect(result.likelyTalentMismatch).toBe(true);
    expect(result.correctionEligible).toBe(false);
  });

  it("blocks correction for verified publishers", () => {
    const result = assessPublisherRoleMismatch({
      publisherType: "individual",
      companyName: null,
      description: "مودل وأبحث عن فرص",
      totalOpportunities: 0,
      verificationStatus: "verified",
    });

    expect(result.correctionEligible).toBe(false);
  });
});
