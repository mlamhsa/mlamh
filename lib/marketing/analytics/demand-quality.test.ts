import test from "node:test";
import assert from "node:assert/strict";

import { buildDemandQuality } from "./demand-quality.ts";

test("prospecting quality uses the same contact readiness gate as the lead workspace", () => {
  const result = buildDemandQuality({
    leads: [
      { id: 1, contact_id: 11 },
      { id: 2, contact_id: 12 },
      { id: 3, contact_id: 13 },
    ],
    contacts: [
      { id: 11, contact_name: "A", email: "a@example.com", metadata: { role: "Producer" } },
      { id: 12, contact_name: "B", linkedin_url: "https://linkedin.com/in/b", metadata: {} },
      { id: 13, contact_name: null, email: "c@example.com", metadata: { job_title: "Casting Director" } },
    ],
    tasks: [
      { lead_id: 1, task_type: "lead_enrichment", status: "completed" },
      { lead_id: 2, task_type: "lead_enrichment", status: "completed" },
      { lead_id: 3, task_type: "lead_enrichment", status: "completed" },
    ],
    outreach: [],
    briefs: [],
  });

  assert.equal(result.researchedLeads, 3);
  assert.equal(result.outreachReadyLeads, 1);
  assert.equal(result.researchToReadyRate, 33);
});

test("outbound conversion is based on distinct leads and explicit recorded outcomes", () => {
  const result = buildDemandQuality({
    leads: [
      { id: 1, contact_id: 11 },
      { id: 2, contact_id: 12 },
      { id: 3, contact_id: 13 },
    ],
    contacts: [
      { id: 11, contact_name: "A", email: "a@example.com", metadata: { role: "Producer" } },
      { id: 12, contact_name: "B", email: "b@example.com", metadata: { role: "Producer" } },
      { id: 13, contact_name: "C", email: "c@example.com", metadata: { role: "Producer" } },
    ],
    tasks: [],
    outreach: [
      { lead_id: 1, send_status: "sent", reply_status: "qualified", outcome: "interested" },
      { lead_id: 1, send_status: "sent", reply_status: "qualified", outcome: "interested" },
      { lead_id: 2, send_status: "sent", reply_status: "none" },
      { lead_id: 3, send_status: "waiting_approval", reply_status: "none" },
    ],
    briefs: [
      { lead_id: 1, status: "complete", opportunity_id: 100 },
      { lead_id: 2, status: "partial", opportunity_id: null },
    ],
  });

  assert.equal(result.outreachPreparedLeads, 3);
  assert.equal(result.sentLeads, 2);
  assert.equal(result.repliedLeads, 1);
  assert.equal(result.positiveReplyLeads, 1);
  assert.equal(result.briefLeads, 2);
  assert.equal(result.completeBriefLeads, 1);
  assert.equal(result.opportunityLeads, 1);
  assert.equal(result.preparedToSentRate, 67);
  assert.equal(result.sentToReplyRate, 50);
  assert.equal(result.sentToBriefRate, 100);
  assert.equal(result.briefToOpportunityRate, 50);
});

test("conversion rates fail closed when denominators do not exist", () => {
  const result = buildDemandQuality({
    leads: [{ id: 1 }],
    contacts: [],
    tasks: [],
    outreach: [],
    briefs: [{ lead_id: 1, status: "complete", opportunity_id: null }],
  });

  assert.equal(result.researchToReadyRate, null);
  assert.equal(result.readyToPreparedRate, null);
  assert.equal(result.preparedToSentRate, null);
  assert.equal(result.sentToReplyRate, null);
  assert.equal(result.replyToPositiveRate, null);
  assert.equal(result.sentToBriefRate, null);
  assert.equal(result.leadToBriefRate, 100);
});
