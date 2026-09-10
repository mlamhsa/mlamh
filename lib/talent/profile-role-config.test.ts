import test from "node:test";
import assert from "node:assert/strict";

import { TALENT_CATEGORIES } from "../data/talent-categories.ts";
import {
  TALENT_PROFILE_ROLE_CONFIGS,
  getTalentProfileRoleConfig,
} from "./profile-role-config.ts";

test("every canonical talent category has profile configuration", () => {
  const categorySlugs = TALENT_CATEGORIES.map((category) => category.slug).sort();
  const configuredSlugs = Object.keys(TALENT_PROFILE_ROLE_CONFIGS).sort();

  assert.deepEqual(configuredSlugs, categorySlugs);
});

test("voice-over profile does not require physical profile fields", () => {
  const config = getTalentProfileRoleConfig("voice_actor");

  assert.ok(config);
  assert.equal(config.showPhysicalDetails, false);
  assert.equal(config.showModelMeasurements, false);
  assert.equal(config.showVideoIntro, true);
});

test("actor and model keep their specialist profile sections", () => {
  const actor = getTalentProfileRoleConfig("actor");
  const model = getTalentProfileRoleConfig("model");

  assert.ok(actor);
  assert.ok(model);
  assert.equal(actor.showActingAgeRange, true);
  assert.equal(actor.showShowreel, true);
  assert.equal(model.showModelMeasurements, true);
});
