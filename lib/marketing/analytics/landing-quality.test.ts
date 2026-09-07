import test from "node:test";
import assert from "node:assert/strict";

import { buildLandingQuality } from "./landing-quality.ts";

test("landing CRO counts unique attributed landing sessions and verified outcome sessions", () => {
  const rows = buildLandingQuality([
    { event_name: "page_view", anonymous_session_id: "a", source: "instagram", metadata: { path: "/ar/opportunities", landing_path: "/ar/opportunities", attribution_landing: true } },
    { event_name: "page_view", anonymous_session_id: "a", source: "instagram", metadata: { path: "/ar/opportunities", landing_path: "/ar/opportunities", attribution_landing: true } },
    { event_name: "page_view", anonymous_session_id: "b", source: "tiktok", metadata: { path: "/ar/opportunities", landing_path: "/ar/opportunities", attribution_landing: true } },
    { event_name: "registration_completed", anonymous_session_id: "a", source: "instagram", metadata: { landing_path: "/ar/opportunities" } },
    { event_name: "application_submitted", anonymous_session_id: "a", source: "instagram", metadata: { landing_path: "/ar/opportunities" } },
  ]);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].landingSessions, 2);
  assert.equal(rows[0].registrationSessions, 1);
  assert.equal(rows[0].applicationSessions, 1);
  assert.equal(rows[0].registrationRate, 50);
  assert.equal(rows[0].applicationRate, 50);
});

test("internal attributed page views are not miscounted as landing visits", () => {
  const rows = buildLandingQuality([
    { event_name: "page_view", anonymous_session_id: "a", source: "instagram", metadata: { path: "/ar", landing_path: "/ar", attribution_landing: true } },
    { event_name: "page_view", anonymous_session_id: "a", source: "instagram", metadata: { path: "/ar/opportunities", landing_path: "/ar", attribution_landing: false } },
  ]);

  assert.equal(rows[0].path, "/ar");
  assert.equal(rows[0].landingSessions, 1);
});

test("outcomes without a session id never fabricate landing conversion", () => {
  const rows = buildLandingQuality([
    { event_name: "page_view", anonymous_session_id: "a", source: "instagram", metadata: { path: "/ar", landing_path: "/ar", attribution_landing: true } },
    { event_name: "registration_completed", anonymous_session_id: null, source: "instagram", metadata: { landing_path: "/ar" } },
  ]);

  assert.equal(rows[0].registrationSessions, 0);
  assert.equal(rows[0].registrationRate, 0);
});
