import test from "node:test";
import assert from "node:assert/strict";

import {
  canExposePublicMarket,
  canExposePublicRecord,
  recordBelongsToPublicMarket,
  resolveLegacyRecordCountry,
} from "./public-access.ts";

test("legacy public records resolve to Saudi during compatibility window", () => {
  assert.equal(resolveLegacyRecordCountry({}), "SA");
  assert.equal(recordBelongsToPublicMarket({}, "SA"), true);
  assert.equal(recordBelongsToPublicMarket({}, "AE"), false);
});

test("explicit non-Saudi records never leak into the Saudi public market", () => {
  assert.equal(recordBelongsToPublicMarket({ country_code: "AE" }, "SA"), false);
  assert.equal(recordBelongsToPublicMarket({ country_code: "SA" }, "SA"), true);
});

test("prepared markets stay publicly closed even when a record is tagged for them", () => {
  assert.equal(canExposePublicMarket("AE", "publicTalentDirectory"), false);
  assert.equal(canExposePublicMarket("AE", "publicOpportunities"), false);
  assert.equal(
    canExposePublicRecord({ country_code: "AE" }, "AE", "publicTalentDirectory"),
    false,
  );
});

test("Saudi public talent and opportunity surfaces remain enabled", () => {
  assert.equal(canExposePublicRecord({}, "SA", "publicTalentDirectory"), true);
  assert.equal(canExposePublicRecord({}, "SA", "publicOpportunities"), true);
});
