import test from "node:test";
import assert from "node:assert/strict";

import {
  canExposePublicMarket,
  canExposePublicRecord,
  canExposePublicTalent,
  opportunityBelongsToPublicMarket,
  resolveLegacyOpportunityCountry,
  resolveLegacyTalentBaseCountry,
  talentBelongsToPublicMarket,
} from "./public-access.ts";

test("legacy public records resolve to Saudi during compatibility window", () => {
  assert.equal(resolveLegacyOpportunityCountry({}), "SA");
  assert.equal(resolveLegacyTalentBaseCountry({}), "SA");
  assert.equal(opportunityBelongsToPublicMarket({}, "SA"), true);
  assert.equal(talentBelongsToPublicMarket({}, "SA"), true);
  assert.equal(talentBelongsToPublicMarket({}, "AE"), false);
});

test("explicit non-Saudi opportunities never leak into the Saudi public market", () => {
  assert.equal(opportunityBelongsToPublicMarket({ country_code: "AE" }, "SA"), false);
  assert.equal(opportunityBelongsToPublicMarket({ country_code: "SA" }, "SA"), true);
});

test("explicit non-Saudi talent base country never leaks into the Saudi directory", () => {
  assert.equal(talentBelongsToPublicMarket({ base_country_code: "AE" }, "SA"), false);
  assert.equal(talentBelongsToPublicMarket({ base_country_code: "SA" }, "SA"), true);
});

test("prepared markets stay publicly closed even when records are tagged for them", () => {
  assert.equal(canExposePublicMarket("AE", "publicTalentDirectory"), false);
  assert.equal(canExposePublicMarket("AE", "publicOpportunities"), false);
  assert.equal(canExposePublicRecord({ country_code: "AE" }, "AE", "publicOpportunities"), false);
  assert.equal(canExposePublicTalent({ base_country_code: "AE" }, "AE"), false);
});

test("Saudi public talent and opportunity surfaces remain enabled", () => {
  assert.equal(canExposePublicTalent({}, "SA"), true);
  assert.equal(canExposePublicRecord({}, "SA", "publicOpportunities"), true);
});
