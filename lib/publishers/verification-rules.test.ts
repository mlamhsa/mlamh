import assert from "node:assert/strict";
import test from "node:test";

import { normalizeOrganizationVerificationEmail } from "./verification-rules.ts";

test("accepts and normalizes organization-domain email", () => {
  assert.equal(normalizeOrganizationVerificationEmail("  Person@Company.COM  "), "person@company.com");
});

test("rejects public personal email providers", () => {
  for (const email of [
    "person@gmail.com",
    "person@hotmail.com",
    "person@outlook.com",
    "person@yahoo.com",
    "person@icloud.com",
    "person@proton.me",
  ]) {
    assert.equal(normalizeOrganizationVerificationEmail(email), null);
  }
});

test("rejects malformed and oversized values", () => {
  assert.equal(normalizeOrganizationVerificationEmail("not-an-email"), null);
  assert.equal(normalizeOrganizationVerificationEmail("a@b"), null);
  assert.equal(normalizeOrganizationVerificationEmail(null), null);
  assert.equal(normalizeOrganizationVerificationEmail(`${"a".repeat(250)}@company.com`), null);
});
