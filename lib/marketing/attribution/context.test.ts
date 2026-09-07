import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  hasMarketingAttribution,
  parseMarketingAttributionCookie,
  sanitizeMarketingAttribution,
  serializeMarketingAttribution,
} from "./context.ts";

function source(path: string) {
  return readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8");
}

test("attribution context sanitizes and round-trips first-party marketing and landing fields", () => {
  const context = sanitizeMarketingAttribution({
    source: " instagram ",
    medium: " organic ",
    campaign: "launch",
    content: "opportunity",
    term: "actors",
    landingPath: "/ar/opportunities?ignored=yes",
    anonymousSessionId: "session-123",
    ignored: "never persisted",
  });

  assert.deepEqual(context, {
    source: "instagram",
    medium: "organic",
    campaign: "launch",
    content: "opportunity",
    term: "actors",
    landingPath: "/ar/opportunities",
    anonymousSessionId: "session-123",
  });
  assert.equal(hasMarketingAttribution(context), true);
  assert.deepEqual(
    parseMarketingAttributionCookie(serializeMarketingAttribution(context)),
    context,
  );
});

test("landing fields alone never manufacture marketing attribution", () => {
  const context = sanitizeMarketingAttribution({ landingPath: "/ar", anonymousSessionId: "session-123" });
  assert.equal(hasMarketingAttribution(context), false);
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
    landingPath: null,
    anonymousSessionId: null,
  });
});

test("verified registration and application writes inherit request landing/session context centrally", () => {
  const accountType = source("app/[locale]/join/account-type/page.tsx");
  const application = source("lib/actions/apply-to-opportunity.ts");
  const tracker = source("components/MarketingAttributionTracker.tsx");
  const eventTracker = source("lib/marketing/events/track.ts");

  assert.match(tracker, /MARKETING_ATTRIBUTION_COOKIE/);
  assert.match(tracker, /SameSite=Lax/);
  assert.match(tracker, /attribution_landing:\s*isAttributedLanding/);
  assert.match(tracker, /landing_path:\s*attribution\.landingPath/);
  assert.match(accountType, /eventName:\s*"registration_completed"/);
  assert.match(accountType, /recordAttributedRegistration/);
  assert.match(application, /eventName:\s*"application_submitted"/);
  assert.match(application, /outcome_verified_server_side:\s*true/);
  assert.match(application, /recordAttributedApplication/);
  assert.match(eventTracker, /requestAttribution\.landingPath/);
  assert.match(eventTracker, /requestAttribution\.anonymousSessionId/);
});
