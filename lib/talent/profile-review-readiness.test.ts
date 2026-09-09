import test from "node:test";
import assert from "node:assert/strict";

import { TALENT_CATEGORIES } from "../data/talent-categories.ts";
import {
  getTalentProfileReadiness,
  getTalentProfileReviewReadiness,
  type TalentProfileReadinessData,
} from "./profile-review-readiness.ts";

const READY_TALENT: TalentProfileReadinessData = {
  name_ar: "موهبة تجريبية",
  phone: "+966500000000",
  image_url: "https://example.com/profile.jpg",
  primary_role: "actor",
  base_country_code: "SA",
  city_slug: "riyadh",
  gender: "male",
  nationality_slug: "saudi",
  date_of_birth: "1995-01-01",
  profile_visibility: "public",
  data_accuracy_contact_consent: true,
};

test("canonical hard gates alone make a Talent ready for review", () => {
  const readiness = getTalentProfileReviewReadiness(READY_TALENT);

  assert.equal(readiness.isReady, true);
  assert.equal(readiness.canSubmitForReview, true);
  assert.equal(readiness.missingRequirements.length, 0);
});

test("optional professional fields never block approval readiness", () => {
  const readiness = getTalentProfileReadiness({
    ...READY_TALENT,
    bio_ar: null,
    bio_en: null,
    height_cm: null,
    acting_age_min: null,
    acting_age_max: null,
    modeling_types: null,
  });

  assert.equal(readiness.isReady, true);
});

test("private visibility is a valid approval choice", () => {
  const readiness = getTalentProfileReviewReadiness({
    ...READY_TALENT,
    profile_visibility: "private",
  });

  assert.equal(readiness.canSubmitForReview, true);
});

test("every canonical Talent category satisfies the talent-type gate", () => {
  for (const category of TALENT_CATEGORIES) {
    const readiness = getTalentProfileReadiness({
      ...READY_TALENT,
      primary_role: category.slug,
    });

    assert.equal(
      readiness.isReady,
      true,
      `${category.slug} should be accepted as a canonical Talent type`,
    );
  }
});

test("each canonical hard gate blocks readiness when missing", () => {
  const cases: Array<[string, Partial<TalentProfileReadinessData>]> = [
    ["name", { name_ar: null, name_en: null }],
    ["phone", { phone: null }],
    ["profile_image", { image_url: null }],
    ["primary_role", { primary_role: null, category_slug: null }],
    ["country", { base_country_code: null }],
    ["city", { city_slug: null }],
    ["gender", { gender: null }],
    ["nationality", { nationality_slug: null, nationality: null }],
    ["date_of_birth", { date_of_birth: null }],
    ["profile_visibility", { profile_visibility: null }],
    ["data_accuracy_contact_consent", { data_accuracy_contact_consent: false }],
  ];

  for (const [expectedKey, override] of cases) {
    const readiness = getTalentProfileReviewReadiness({
      ...READY_TALENT,
      ...override,
    });

    assert.equal(readiness.canSubmitForReview, false);
    assert.ok(
      readiness.missingRequirements.some((requirement) => requirement.key === expectedKey),
      `${expectedKey} should be reported as missing`,
    );
  }
});
