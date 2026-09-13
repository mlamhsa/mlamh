import test from "node:test";
import assert from "node:assert/strict";

import { getTalentProfileDataQualityIssues } from "./profile-data-quality.ts";

test("zero measurements are allowed and do not create data-quality issues", () => {
  const issues = getTalentProfileDataQualityIssues({
    height_cm: 0,
    weight_kg: 0,
    shoe_size: 0,
    chest_size: 0,
    waist_size: 0,
    hip_size: 0,
  });

  assert.deepEqual(issues, []);
});

test("blank optional measurements are ignored", () => {
  const issues = getTalentProfileDataQualityIssues({
    height_cm: null,
    weight_kg: undefined,
    shoe_size: "",
    chest_size: "   ",
    waist_size: null,
    hip_size: "\t",
  });

  assert.deepEqual(issues, []);
});

test("negative measurements are still reported", () => {
  const issues = getTalentProfileDataQualityIssues({
    chest_size: -1,
    hip_size: "-2",
    waist_size: 0,
  });

  assert.equal(issues.length, 2);
  assert.deepEqual(
    issues.map((issue) => [issue.key, issue.value]),
    [
      ["chest_size", -1],
      ["hip_size", -2],
    ],
  );
});
