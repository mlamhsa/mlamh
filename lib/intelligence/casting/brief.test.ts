import test from "node:test";
import assert from "node:assert/strict";

import { buildTalentBriefFromCastingRole } from "./brief.ts";

test("casting role becomes a Saudi talent brief by default", () => {
  const brief = buildTalentBriefFromCastingRole(
    { talent_type: "model", required_count: 5, city: "riyadh" },
    { requirements: { gender: "female" } },
  );

  assert.equal(brief.country_code, "SA");
  assert.equal(brief.talent_count, 5);
  assert.equal(brief.talent_type, "model");
  assert.equal(brief.city, "riyadh");
  assert.equal(brief.required_gender, "female");
});

test("role requirements override project fallback without inventing missing fields", () => {
  const brief = buildTalentBriefFromCastingRole(
    { talent_type: "actor", required_count: 2, city: "riyadh" },
    {
      talent_type: "model",
      required_count: 3,
      requirements: {
        city: "jeddah",
        city_flexible: true,
        skills: ["beauty"],
      },
    },
  );

  assert.equal(brief.talent_type, "model");
  assert.equal(brief.talent_count, 3);
  assert.equal(brief.city, "jeddah");
  assert.equal(brief.city_flexible, true);
  assert.deepEqual(brief.requirements?.skills, ["beauty"]);
  assert.equal(brief.required_gender, null);
});
