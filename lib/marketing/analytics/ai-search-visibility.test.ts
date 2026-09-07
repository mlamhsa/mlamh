import test from "node:test";
import assert from "node:assert/strict";

import { buildAiSearchVisibility, classifyAiSearchEvent } from "./ai-search-visibility.ts";

test("classifies only explicit AI referrer or source evidence", () => {
  assert.equal(classifyAiSearchEvent({ event_name: "page_view", referrer: "https://chatgpt.com/c/abc" }), "chatgpt");
  assert.equal(classifyAiSearchEvent({ event_name: "page_view", referrer: "https://www.perplexity.ai/search/test" }), "perplexity");
  assert.equal(classifyAiSearchEvent({ event_name: "page_view", source: "google_gemini" }), "gemini");
  assert.equal(classifyAiSearchEvent({ event_name: "page_view", referrer: "https://www.google.com/search?q=mlamh" }), null);
  assert.equal(classifyAiSearchEvent({ event_name: "page_view", referrer: "not-a-url" }), null);
});

test("links verified outcomes only through an observed AI referral session", () => {
  const rows = buildAiSearchVisibility([
    {
      event_name: "page_view",
      anonymous_session_id: "s1",
      referrer: "https://chatgpt.com/",
      metadata: { path: "/ar/opportunities/model-campaign" },
    },
    { event_name: "registration_completed", anonymous_session_id: "s1" },
    { event_name: "application_submitted", anonymous_session_id: "s1" },
    { event_name: "brief_received", anonymous_session_id: "different-session" },
    { event_name: "registration_completed", anonymous_session_id: null, source: "chatgpt" },
  ]);

  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.platform, "chatgpt");
  assert.equal(rows[0]?.observedPageViews, 1);
  assert.equal(rows[0]?.linkedSessions, 1);
  assert.equal(rows[0]?.registrationSessions, 1);
  assert.equal(rows[0]?.applicationSessions, 1);
  assert.equal(rows[0]?.briefSessions, 0);
  assert.equal(rows[0]?.registrationRate, 100);
  assert.equal(rows[0]?.applicationRate, 100);
  assert.deepEqual(rows[0]?.topPaths, [{ path: "/ar/opportunities/model-campaign", views: 1 }]);
});

test("does not fabricate conversion rates when AI visits lack session linkage", () => {
  const rows = buildAiSearchVisibility([
    { event_name: "page_view", referrer: "https://claude.ai/", metadata: { path: "/en/guides" } },
  ]);

  assert.equal(rows[0]?.platform, "claude");
  assert.equal(rows[0]?.observedPageViews, 1);
  assert.equal(rows[0]?.linkedSessions, 0);
  assert.equal(rows[0]?.registrationRate, null);
  assert.equal(rows[0]?.applicationRate, null);
  assert.equal(rows[0]?.briefRate, null);
});
