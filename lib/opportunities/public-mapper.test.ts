import assert from "node:assert/strict";
import test from "node:test";

import { toPublicOpportunity } from "./public-mapper.ts";

const row = {
  id: 101,
  title: "فرصة إعلان",
  title_en: "Commercial Opportunity",
  slug: "commercial-opportunity",
  description: "وصف عربي",
  description_en: "English description",
  opportunity_type: "model",
  country_code: "SA" as const,
  currency: "SAR",
  city_slug: "riyadh",
  city_ar: "الرياض",
  city_en: "Riyadh",
  required_gender: null,
  min_age: 20,
  max_age: 35,
  compensation_type: "fixed" as const,
  budget: "1500",
  company_name: "MLAMH",
  featured: true,
  featured_until: null,
  managed_by_mlamh: true,
  expires_at: null,
  created_at: "2026-09-03T10:00:00.000Z",
  published: true,
  status: "open",
  contact_name: "Private Contact",
  contact_phone: "+966500000000",
  contact_email: "private@example.com",
};

test("maps localized public opportunity fields", () => {
  const english = toPublicOpportunity(row, "en");
  const arabic = toPublicOpportunity(row, "ar");

  assert.equal(english.title, "Commercial Opportunity");
  assert.equal(english.description, "English description");
  assert.equal(english.city, "Riyadh");
  assert.equal(arabic.title, "فرصة إعلان");
  assert.equal(arabic.description, "وصف عربي");
  assert.equal(arabic.city, "الرياض");
});

test("does not expose private contact fields", () => {
  const publicOpportunity = toPublicOpportunity(row, "en");
  const keys = Object.keys(publicOpportunity);

  assert.equal(keys.includes("contact_name"), false);
  assert.equal(keys.includes("contact_phone"), false);
  assert.equal(keys.includes("contact_email"), false);
  assert.equal(keys.includes("contactName"), false);
  assert.equal(keys.includes("contactPhone"), false);
  assert.equal(keys.includes("contactEmail"), false);
});
