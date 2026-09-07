import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path: string) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

test("opportunity intent pages use active inventory and noindex empty intent pages", () => {
  const page = source("app/[locale]/opportunities/type/[type]/page.tsx");

  assert.match(page, /isOpportunityOpenForSeo/);
  assert.match(page, /activeMatches\(opportunities, type\)/);
  assert.match(page, /robots:\s*hasActiveInventory/);
  assert.match(page, /index:\s*false,\s*follow:\s*true/);
});

test("opportunity intent page inventory excludes expired records before rendering cards", () => {
  const page = source("app/[locale]/opportunities/type/[type]/page.tsx");

  assert.match(page, /config\.accepted\.has/);
  assert.match(page, /isOpportunityOpenForSeo\(item\)/);
  assert.match(page, /const matches = activeMatches\(opportunities, type\)/);
});
