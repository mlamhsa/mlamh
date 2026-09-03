import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeInternationalPhone,
  parseDanaLocation,
} from "./location.ts";

test("Saudi location parsing remains backward compatible", () => {
  assert.deepEqual(parseDanaLocation("نحتاج مودل في جدة"), {
    countryCode: "SA",
    city: "Jeddah",
  });
  assert.equal(normalizeInternationalPhone("055 555 5555"), "+966555555555");
});

test("prepared markets are parsed without activating them", () => {
  assert.deepEqual(parseDanaLocation("casting in Dubai"), {
    countryCode: "AE",
    city: "Dubai",
  });
  assert.deepEqual(parseDanaLocation("نحتاج ممثل في القاهرة"), {
    countryCode: "EG",
    city: "Cairo",
  });
  assert.deepEqual(parseDanaLocation("مودل في الدار البيضاء"), {
    countryCode: "MA",
    city: "Casablanca",
  });
  assert.deepEqual(parseDanaLocation("shoot in Doha"), {
    countryCode: "QA",
    city: "Doha",
  });
});

test("country-only text can establish market context without inventing a city", () => {
  assert.deepEqual(parseDanaLocation("campaign in Morocco"), {
    countryCode: "MA",
    city: null,
  });
});

test("international phone normalization uses explicit country hint", () => {
  assert.equal(normalizeInternationalPhone("050 123 4567", "AE"), "+971501234567");
  assert.equal(normalizeInternationalPhone("010 1234 5678", "EG"), "+201012345678");
  assert.equal(normalizeInternationalPhone("0612 345678", "MA"), "+212612345678");
  assert.equal(normalizeInternationalPhone("3312 3456", "QA"), "33123456");
});

test("explicit international prefixes are preserved regardless of hint", () => {
  assert.equal(normalizeInternationalPhone("00971 50 123 4567", "SA"), "+971501234567");
  assert.equal(normalizeInternationalPhone("+212 612 345678", "SA"), "+212612345678");
});

test("ambiguous local numbers are not assigned to a country", () => {
  assert.equal(normalizeInternationalPhone("3312 3456"), "33123456");
});
