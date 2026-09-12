import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  canAutoVerifyResearchContact,
  getOutreachReadiness,
  isPersonalLinkedInUrl,
} from "./outreach-readiness.ts";

function source(path: string) {
  return readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8");
}

test("outreach readiness requires contact name, professional role and a reachable channel", () => {
  assert.equal(getOutreachReadiness(null).isReady, false);
  assert.deepEqual(getOutreachReadiness(null).missingFields, ["contact_name", "contact_role", "verified_channel"]);

  assert.equal(getOutreachReadiness({
    contact_name: "Sawsan",
    email: "sawsan@example.com",
    linkedin_url: null,
    metadata: {},
  }).isReady, false);

  assert.equal(getOutreachReadiness({
    contact_name: "Sawsan",
    email: "sawsan@example.com",
    linkedin_url: null,
    metadata: { role: "Marketing Manager" },
  }).isReady, true);
});

test("contact auto-verification requires a named person, explicit role, channel and source evidence", () => {
  const ready = canAutoVerifyResearchContact({
    verified_contact_person: "Sawsan Ahdadi",
    role: "Business Development Manager",
    email: "sawsan@example.com",
    linkedin_url: null,
    source_evidence: ["https://example.com/team/sawsan"],
  });
  assert.equal(ready.allowed, true);

  assert.equal(canAutoVerifyResearchContact({
    verified_contact_person: "Marketing Team",
    role: "Marketing",
    email: "marketing@example.com",
    linkedin_url: null,
    source_evidence: ["https://example.com/contact"],
  }).allowed, false);

  assert.equal(canAutoVerifyResearchContact({
    verified_contact_person: "Sawsan Ahdadi",
    role: "Business Development Manager",
    email: "sawsan@example.com",
    linkedin_url: null,
    source_evidence: [],
  }).allowed, false);
});

test("localized personal LinkedIn URLs are accepted while company pages are rejected", () => {
  assert.equal(isPersonalLinkedInUrl("https://www.linkedin.com/in/sawsan-ahdadi"), true);
  assert.equal(isPersonalLinkedInUrl("https://sa.linkedin.com/in/sawsan-ahdadi"), true);
  assert.equal(isPersonalLinkedInUrl("https://www.linkedin.com/company/example"), false);
});

test("orchestrator, AI grounding and materializer consume the shared readiness contract", () => {
  const orchestrator = source("lib/marketing/orchestrator.ts");
  const runner = source("lib/marketing/tasks/runner.ts");
  const materializer = source("lib/marketing/tasks/materialize.ts");

  assert.match(orchestrator, /getOutreachReadiness/);
  assert.match(orchestrator, /if \(!readiness\.isReady\)/);
  assert.match(orchestrator, /taskType: "lead_enrichment"/);
  assert.match(runner, /outreach_ready: readiness\.isReady/);
  assert.match(runner, /missing_fields: readiness\.missingFields/);
  assert.match(materializer, /if \(!readiness\.isReady\) continue/);
});

test("main marketing orchestrator applies CEO-approved contact auto-verification after the autonomous cycle", () => {
  const route = source("app/api/marketing/orchestrator/route.ts");
  const autoMaterializer = source("lib/marketing/leads/auto-materialize.ts");

  assert.match(route, /materializeAutoVerifiedLeadResearch/);
  assert.match(route, /const result = await runAutonomousMarketingCycle/);
  assert.match(route, /const contactAutoVerification = await autoVerifyResearchSafely/);
  assert.match(route, /return await materializeAutoVerifiedLeadResearch\(\{ limit: 12 \}\)/);
  assert.match(autoMaterializer, /ceo_approved_auto_verification_policy/);
  assert.match(autoMaterializer, /external_send_allowed: false/);
  assert.match(autoMaterializer, /getOutreachReadiness\(current\)\.isReady/);
});

test("newly outreach-ready leads supersede open research and are promoted across the active pipeline", () => {
  const orchestrator = source("lib/marketing/orchestrator.ts");

  assert.match(orchestrator, /cancelSupersededLeadEnrichment/);
  assert.match(orchestrator, /lead_now_has_outreach_ready_verified_contact/);
  assert.match(orchestrator, /next_step: "outreach_preparation"/);
  assert.match(orchestrator, /\.limit\(20\)/);
  assert.match(orchestrator, /\.eq\("send_status", "sent"\)/);
  assert.match(orchestrator, /supersededEnrichmentCancelled/);
});
