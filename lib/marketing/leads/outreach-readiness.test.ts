import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { evaluateContactAutoVerification, validPublicLinkedInProfile } from "./contact-auto-verification.ts";
import { getOutreachReadiness } from "./outreach-readiness.ts";

function source(path: string) {
  return readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8");
}

test("outreach readiness requires contact name, professional role and a reachable channel", () => {
  assert.equal(getOutreachReadiness({
    contact_name: "Producer Name",
    email: "producer@example.com",
    metadata: { job_title: "Executive Producer" },
  }).isReady, true);

  assert.equal(getOutreachReadiness({
    contact_name: "Producer Name",
    linkedin_url: "https://sa.linkedin.com/in/producer-name",
    metadata: { professional_role: "Executive Producer" },
  }).isReady, true);

  const missingRole = getOutreachReadiness({
    contact_name: "Producer Name",
    email: "producer@example.com",
    metadata: {},
  });
  assert.equal(missingRole.isReady, false);
  assert.deepEqual(missingRole.missingFields, ["contact_role"]);

  const missingChannel = getOutreachReadiness({
    contact_name: "Producer Name",
    metadata: { role: "Producer" },
  });
  assert.equal(missingChannel.isReady, false);
  assert.deepEqual(missingChannel.missingFields, ["contact_channel"]);
});

test("contact auto-verification requires a named person, explicit role, channel and source evidence", () => {
  const verified = evaluateContactAutoVerification({
    contact_name: "Ahmed Example",
    professional_role: "Director of Business Development",
    linkedin_url: "https://sa.linkedin.com/in/ahmed-example",
    source_urls: ["https://company.example/team", "https://sa.linkedin.com/in/ahmed-example"],
  });
  assert.equal(verified.isAutoVerifiable, true);
  assert.equal(verified.approvalSource, "ceo_approved_auto_verification_policy");

  const generic = evaluateContactAutoVerification({
    contact_name: "Example Team",
    professional_role: "Business Development",
    email: "info@example.com",
    source_urls: ["https://company.example/contact"],
  });
  assert.equal(generic.isAutoVerifiable, false);
  assert.deepEqual(generic.missingFields, ["named_contact"]);

  const unsupported = evaluateContactAutoVerification({
    contact_name: "Ahmed Example",
    professional_role: "Producer",
    linkedin_url: "https://www.linkedin.com/company/example",
    source_urls: ["https://www.linkedin.com/company/example"],
  });
  assert.equal(unsupported.isAutoVerifiable, false);
  assert.deepEqual(unsupported.missingFields, ["verified_channel"]);
});

test("localized personal LinkedIn URLs are accepted while company pages are rejected", () => {
  assert.ok(validPublicLinkedInProfile("https://sa.linkedin.com/in/ahmed-example"));
  assert.ok(validPublicLinkedInProfile("https://www.linkedin.com/in/ahmed-example/"));
  assert.equal(validPublicLinkedInProfile("https://www.linkedin.com/company/example"), null);
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
  assert.match(route, /const contactAutoVerification = await materializeAutoVerifiedLeadResearch/);
  assert.match(autoMaterializer, /ceo_approved_auto_verification_policy/);
  assert.match(autoMaterializer, /external_send_allowed: false/);
  assert.match(autoMaterializer, /getOutreachReadiness\(current\)\.isReady/);
});
