import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { buildDeterministicOutreachFallback, isFreeMarketingAIUnavailableError } from "./deterministic-fallback.ts";

function source(path: string) {
  return readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8");
}

test("detects free-capacity failures but not unrelated task errors", () => {
  assert.equal(isFreeMarketingAIUnavailableError("No providers for model minimax/minimax-m2.7 have the required capabilities: free."), true);
  assert.equal(isFreeMarketingAIUnavailableError("Free tier users do not have access to this model."), true);
  assert.equal(isFreeMarketingAIUnavailableError("database connection failed"), false);
});

test("builds a governed LinkedIn draft only from verified task input", () => {
  const result = buildDeterministicOutreachFallback({
    task_type: "outreach_preparation",
    channel: "linkedin",
    input: {
      lead_id: 15,
      organization: "Dokkan Media Agency",
      opportunity_type: "commercial_casting",
      contact: {
        name: "Hosam Abu Shamsieh",
        role: "Co-Founder / CEO",
        linkedin_available: true,
        email_available: false,
      },
    },
  });

  assert.ok(result);
  assert.equal(result?.outreach_drafts[0]?.lead_id, 15);
  assert.equal(result?.outreach_drafts[0]?.channel, "linkedin");
  assert.match(result?.outreach_drafts[0]?.message ?? "", /Hosam Abu Shamsieh/);
  assert.match(result?.outreach_drafts[0]?.message ?? "", /MLAMH منصة متخصصة/);
  assert.equal(result?.fallback_metadata.external_send_allowed, false);
  assert.equal(result?.fallback_metadata.paid_ai_used, false);
});

test("refuses fallback when verified contact identity, role or channel is missing", () => {
  assert.equal(buildDeterministicOutreachFallback({
    task_type: "outreach_preparation",
    channel: "email",
    input: {
      lead_id: 8,
      organization: "Example Production",
      contact: { name: "Example Team", email_available: true },
    },
  }), null);
});

test("orchestrator route runs deterministic recovery after the autonomous cycle", () => {
  const route = source("app/api/marketing/orchestrator/route.ts");
  const recovery = source("lib/marketing/outreach/deterministic-recovery.ts");
  assert.match(route, /recoverFreeCapacityOutreachDrafts/);
  assert.match(route, /const result = await runAutonomousMarketingCycle/);
  assert.match(route, /const deterministicOutreachRecovery = await recoverFreeCapacityOutreachDrafts/);
  assert.match(recovery, /task_completed_deterministic_fallback/);
  assert.match(recovery, /external_send_allowed: false/);
  assert.match(recovery, /paid_ai_used: false/);
});
