import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateTalentSupplyGap,
  evaluateTalentForBrief,
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
    { ...qualified, city_slug: "riyadh" },
    { city: "jeddah" },
  );
  assert.ok(mismatch.reasons.includes("city_mismatch"));

  const missing = evaluateTalentForBrief(
    { ...qualified, city_slug: null, city_ar: null, city_en: null },
    { city: "jeddah" },
  );
  assert.ok(missing.reasons.includes("missing_required_city"));

  assert.equal(evaluateTalentForBrief(qualified, { city: "jeddah" }).sendable, true);
});

test("explicit flexible city allows talents from other cities", () => {
  assert.equal(
    evaluateTalentForBrief(
      { ...qualified, city_slug: "riyadh" },
      { city: "jeddah", city_flexible: true },
    ).sendable,
    true,
  );
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
  const gap = calculateTalentSupplyGap(
    { talent_count: 3, talent_type: "model", required_gender: "female" },
    [qualified, { ...qualified, gender: null }, { ...qualified, primary_role: "actor" }],
  );
  assert.deepEqual(
    { needed: gap.needed, available: gap.available, missing: gap.missing },
    { needed: 3, available: 1, missing: 2 },
  );
  assert.ok(gap.reasons.includes("insufficient_matches"));
});
