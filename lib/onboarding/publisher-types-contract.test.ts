import { describe, expect, it } from "vitest";

const databasePublisherTypes = [
  "production_company",
  "advertising_agency",
  "casting_agency",
  "talent_agency",
  "brand",
  "content_company",
  "individual",
  "other",
] as const;

const onboardingPublisherTypes = [
  "individual",
  "production_company",
  "advertising_agency",
  "casting_agency",
  "talent_agency",
  "brand",
  "content_company",
  "other",
] as const;

describe("publisher onboarding database contract", () => {
  it("uses only publisher_type values accepted by Production", () => {
    expect(new Set(onboardingPublisherTypes)).toEqual(new Set(databasePublisherTypes));
  });
});
