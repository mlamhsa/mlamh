import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateTalentSupplyGap,
  evaluateTalentForBrief,
  evaluateTalentSupplyForBrief,
  type BriefTalent,
} from "./supply.ts";

const qualified: BriefTalent = {
  status: "approved",
  published: true,
  image_url: "https://cdn.example.com/model.jpg",
  name_en: "Model",
  primary_role: "model",
  city_slug: "jeddah",
  profile_approval_status: "approved",
  profile_status: "active",
  gender: "female",
  availability_status: "available_now",
  skills: ["ecommerce", "beauty"],
};

test("qualified talent matching hard requirements is sendable", () => {
  const result = evaluateTalentForBrief(qualified, {
    talent_type: "model",
    city: "jeddah",
    city_required: true,
    required_gender: "female",
    availability_status: "available_now",
  });
  assert.equal(result.status, "sendable_for_brief");
  assert.equal(result.cityMatch, "local");
  assert.deepEqual(result.reasons, []);
});

test("missing required gender is not guessed", () => {
  const result = evaluateTalentForBrief(
    { ...qualified, gender: null },
    { talent_type: "model", required_gender: "female" },
  );
  assert.equal(result.status, "not_sendable_for_brief");
  assert.ok(result.reasons.includes("missing_required_gender"));
});

test("brief city is a hard requirement by default", () => {
  const mismatch = evaluateTalentForBrief(
    { ...qualified, city_slug: "riyadh", ready_to_travel: true },
    { city: "jeddah" },
  );
  assert.ok(mismatch.reasons.includes("city_mismatch"));
  assert.equal(mismatch.cityMatch, "none");

  const missing = evaluateTalentForBrief(
    { ...qualified, city_slug: null, city_ar: null, city_en: null },
    { city: "jeddah" },
  );
  assert.ok(missing.reasons.includes("missing_required_city"));
  assert.equal(missing.cityMatch, "none");

  const local = evaluateTalentForBrief(qualified, { city: "jeddah" });
  assert.equal(local.sendable, true);
  assert.equal(local.cityMatch, "local");
});

test("flexible city still requires talent opt-in for out-of-city work", () => {
  const result = evaluateTalentForBrief(
    { ...qualified, city_slug: "riyadh" },
    { city: "jeddah", city_flexible: true },
  );
  assert.equal(result.sendable, false);
  assert.equal(result.cityMatch, "none");
  assert.ok(result.reasons.includes("city_mismatch"));
});

test("travel-ready talent can match a flexible request in another city", () => {
  const result = evaluateTalentForBrief(
    { ...qualified, city_slug: "riyadh", ready_to_travel: true },
    { city: "jeddah", city_flexible: true },
  );
  assert.equal(result.sendable, true);
  assert.equal(result.cityMatch, "travel");
  assert.deepEqual(result.reasons, []);
});

test("work-outside-city preference also enables a flexible travel match", () => {
  const result = evaluateTalentForBrief(
    { ...qualified, city_slug: "riyadh", work_outside_city: true },
    { city: "jeddah", city_required: false },
  );
  assert.equal(result.sendable, true);
  assert.equal(result.cityMatch, "travel");
});

test("publisher local-only requirement overrides talent travel willingness", () => {
  const result = evaluateTalentForBrief(
    {
      ...qualified,
      city_slug: "riyadh",
      ready_to_travel: true,
      work_outside_city: true,
    },
    { city: "jeddah", city_required: true, city_flexible: false },
  );
  assert.equal(result.sendable, false);
  assert.equal(result.cityMatch, "none");
  assert.ok(result.reasons.includes("city_mismatch"));
});

test("availability is a brief requirement, not qualification", () => {
  const unavailable = { ...qualified, availability_status: "unavailable" };
  assert.equal(evaluateTalentForBrief(unavailable, {}).qualification.qualified, true);
  assert.ok(
    evaluateTalentForBrief(unavailable, { availability_required: true }).reasons.includes(
      "availability_mismatch",
    ),
  );
});

test("actual supported hard data is enforced without inference", () => {
  const missingSkills = evaluateTalentForBrief(
    { ...qualified, skills: null },
    { requirements: { skills: ["beauty"] } },
  );
  assert.ok(missingSkills.reasons.includes("missing_required_skills"));

  const matchingSkills = evaluateTalentForBrief(qualified, {
    requirements: { skills: ["beauty"] },
  });
  assert.equal(matchingSkills.sendable, true);
});

test("supply gap reports insufficient matches and never pads availability", () => {
  const brief = {
    talent_count: 3,
    talent_type: "model",
    required_gender: "female",
  };
  const supply = evaluateTalentSupplyForBrief(
    brief,
    [qualified, { ...qualified, gender: null }, { ...qualified, primary_role: "actor" }],
  );
  const gap = calculateTalentSupplyGap(brief, supply);
  assert.deepEqual(
    { needed: gap.needed, available: gap.available, missing: gap.missing },
    { needed: 3, available: 1, missing: 2 },
  );
  assert.ok(gap.reasons.includes("insufficient_matches"));
  assert.ok(gap.reasons.includes("missing_required_gender"));
  assert.ok(gap.reasons.includes("role_mismatch"));
});

test("qualified supply stays distinct from sendable supply", () => {
  const supply = evaluateTalentSupplyForBrief(
    { city: "jeddah", required_gender: "female" },
    [
      qualified,
      { ...qualified, name_en: "Riyadh", city_slug: "riyadh" },
      { ...qualified, name_en: "No image", image_url: null },
    ],
  );

  assert.equal(supply.candidatePool.length, 3);
  assert.equal(supply.qualifiedTalents.length, 2);
  assert.equal(supply.sendableTalents.length, 1);
  assert.ok(supply.evaluations[1].reasons.includes("city_mismatch"));
  assert.ok(
    supply.evaluations[2].reasons.includes("not_qualified:missing_image"),
  );
});

test("legacy talent remains eligible for Saudi briefs only", () => {
  assert.equal(
    evaluateTalentForBrief(qualified, { country_code: "SA", city: "jeddah" }).sendable,
    true,
  );

  const uae = evaluateTalentForBrief(
    { ...qualified, ready_to_travel: true },
    {
      country_code: "AE",
      city: "dubai",
      city_flexible: true,
    },
  );
  assert.equal(uae.sendable, false);
  assert.ok(uae.reasons.includes("market_mismatch"));
});

test("cross-border talent is sendable only when opportunity market is explicitly allowed", () => {
  const egyptBased = {
    ...qualified,
    base_country_code: "EG" as const,
    work_market_codes: ["SA"] as const,
    city_slug: "cairo",
    ready_to_travel: true,
  };

  const sa = evaluateTalentForBrief(egyptBased, {
    country_code: "SA",
    city: "riyadh",
    city_flexible: true,
  });
  assert.equal(sa.sendable, true);
  assert.equal(sa.cityMatch, "travel");

  const ae = evaluateTalentForBrief(egyptBased, {
    country_code: "AE",
    city: "dubai",
    city_flexible: true,
  });
  assert.equal(ae.sendable, false);
  assert.ok(ae.reasons.includes("market_mismatch"));
});
