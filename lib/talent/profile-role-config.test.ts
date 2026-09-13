import test from "node:test";
import assert from "node:assert/strict";

import { TALENT_CATEGORIES } from "../data/talent-categories.ts";
import {
  TALENT_PROFILE_ROLE_CONFIGS,
  getTalentProfileRoleConfig,
} from "./profile-role-config.ts";

test("canonical talent categories are limited to actor and model", () => {
  const categorySlugs = TALENT_CATEGORIES.map((category) => category.slug).sort();

  assert.deepEqual(categorySlugs, ["actor", "model"]);
});

test("every canonical talent category has profile configuration", () => {
  const categorySlugs = TALENT_CATEGORIES.map((category) => category.slug).sort();
  const configuredSlugs = Object.keys(TALENT_PROFILE_ROLE_CONFIGS).sort();

  assert.deepEqual(configuredSlugs, categorySlugs);
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

test("inactive future talent roles are not exposed as active profile types", () => {
  assert.equal(getTalentProfileRoleConfig("voice_actor"), null);
  assert.equal(getTalentProfileRoleConfig("presenter"), null);
  assert.equal(getTalentProfileRoleConfig("influencer"), null);
});
