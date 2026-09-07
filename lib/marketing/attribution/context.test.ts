import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  hasMarketingAttribution,
  parseMarketingAttributionCookie,
  sanitizeMarketingAttribution,
  serializeMarketingAttribution,
} from "@/lib/marketing/attribution/context";

function source(path: string) {
  return readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8");
}

test("attribution context sanitizes and round-trips first-party marketing fields", () => {
  const context = sanitizeMarketingAttribution({
    source: " instagram ",
    medium: " organic ",
    campaign: "launch",
    content: "opportunity",
    term: "actors",
    ignored: "never persisted",
  });

  assert.deepEqual(context, {
    source: "instagram",
    medium: "organic",
    campaign: "launch",
    content: "opportunity",
    term: "actors",
  });
  assert.equal(hasMarketingAttribution(context), true);
  assert.deepEqual(
    parseMarketingAttributionCookie(serializeMarketingAttribution(context)),
    context,
  );
});

test("invalid attribution cookie fails closed without inventing source data", () => {
  const context = parseMarketingAttributionCookie("not-json");
  assert.equal(hasMarketingAttribution(context), false);
  assert.deepEqual(context, {
    source: null,
    medium: null,
    campaign: null,
    content: null,
    term: null,
  });
});

test("verified registration and application writes emit marketing outcomes server-side", () => {
  const accountType = source("app/[locale]/join/account-type/page.tsx");
  const application = source("lib/actions/apply-to-opportunity.ts");
  const tracker = source("components/MarketingAttributionTracker.tsx");

  assert.match(tracker, /MARKETING_ATTRIBUTION_COOKIE/);
  assert.match(tracker, /SameSite=Lax/);
  assert.match(accountType, /eventName:\s*"registration_completed"/);
  assert.match(accountType, /recordAttributedRegistration/);
  assert.match(application, /eventName:\s*"application_submitted"/);
  assert.match(application, /outcome_verified_server_side:\s*true/);
  assert.match(application, /recordAttributedApplication/);
});
