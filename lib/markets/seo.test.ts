import test from "node:test";
import assert from "node:assert/strict";

import { canIndexMarket, getIndexableMarkets } from "./seo.ts";

test("Saudi Arabia is the only indexable market", () => {
  assert.deepEqual(getIndexableMarkets(), ["SA"]);
  assert.equal(canIndexMarket("SA"), true);
});

test("prepared and future markets remain excluded from SEO", () => {
  for (const countryCode of ["AE", "EG", "MA", "QA", "JO", "LB", "KW"] as const) {
    assert.equal(canIndexMarket(countryCode), false);
  }
});
