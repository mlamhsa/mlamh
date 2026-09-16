import test from "node:test";
import assert from "node:assert/strict";

import { findSaudiCity, getSaudiCityBySlug } from "./saudi-cities.ts";

test("canonical Saudi city lookup resolves current and legacy slugs", () => {
  assert.equal(getSaudiCityBySlug("riyadh")?.slug, "riyadh");
  assert.equal(getSaudiCityBySlug("khamis_mushait")?.slug, "khamis-mushait");
  assert.equal(getSaudiCityBySlug("buraidah")?.slug, "buraydah");
});

test("Saudi city lookup resolves localized labels", () => {
  assert.equal(findSaudiCity("Riyadh")?.slug, "riyadh");
  assert.equal(findSaudiCity("الرياض")?.slug, "riyadh");
});

test("regions are not accepted as city identifiers", () => {
  assert.equal(findSaudiCity("qassim"), null);
  assert.equal(findSaudiCity("القصيم"), null);
});
