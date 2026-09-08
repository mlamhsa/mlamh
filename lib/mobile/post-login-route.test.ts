import assert from "node:assert/strict";
import test from "node:test";

import { getSafePostLoginPath } from "./post-login-route.ts";

test("keeps talent return paths inside talent-safe native destinations", () => {
  assert.equal(getSafePostLoginPath("/opportunities/casting-1", "talent"), "/opportunities/casting-1");
  assert.equal(getSafePostLoginPath("/applications/42", "talent"), "/applications/42");
  assert.equal(getSafePostLoginPath("/publisher", "talent"), null);
});

test("keeps publisher return paths inside publisher-safe native destinations", () => {
  assert.equal(getSafePostLoginPath("/publisher/opportunities/17", "publisher"), "/publisher/opportunities/17");
  assert.equal(getSafePostLoginPath("/publisher/verification", "publisher"), "/publisher/verification");
  assert.equal(getSafePostLoginPath("/applications", "publisher"), null);
});

test("allows shared destinations for both account types", () => {
  for (const path of ["/casting", "/notifications", "/support"] as const) {
    assert.equal(getSafePostLoginPath(path, "talent"), path);
    assert.equal(getSafePostLoginPath(path, "publisher"), path);
  }
});

test("rejects external, protocol-relative and malformed return paths", () => {
  assert.equal(getSafePostLoginPath("https://evil.example", "talent"), null);
  assert.equal(getSafePostLoginPath("//evil.example", "publisher"), null);
  assert.equal(getSafePostLoginPath("/opportunities/a/b", "talent"), null);
  assert.equal(getSafePostLoginPath("/publisher/opportunities/not-a-number", "publisher"), null);
});
