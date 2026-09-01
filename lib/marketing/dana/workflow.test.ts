import test from "node:test";
import assert from "node:assert/strict";

import {
  buildResolvedCommercialDemandKey,
  mergeSourceReferences,
  runWithWorkflowLock,
} from "./workflow.ts";
import {
  classifyCommercialInquiry,
  type CommercialInquiry,
} from "./domain.ts";

const base: CommercialInquiry = {
  sourceChannel: "support",
  sourceReference: "support-ticket:FEHA-1",
  occurredAt: "2026-09-01T09:00:00Z",
  senderName: "Feha's Collection",
  senderEmail: "casting@feha.example",
  senderPhone: "+966555555555",
  organizationName: "Feha's Abaya",
  subject: "مودل لمحتوى العباءات",
  category: "general_inquiry",
  message: "نحتاج عارضة مودل أنثى في جدة بشكل شهري لتصوير ريلز وفيديو سوشيال ميديا.",
};

test("resolved contact identity keeps email+phone, phone-only and email-only on one commercial demand", () => {
  const classification = classifyCommercialInquiry(base);
  const both = buildResolvedCommercialDemandKey(base, classification, 501);
  const phoneOnly = buildResolvedCommercialDemandKey(
    { ...base, sourceChannel: "whatsapp", sourceReference: "whatsapp:FEHA-2", senderEmail: null },
    classification,
    501,
  );
  const emailOnly = buildResolvedCommercialDemandKey(
    { ...base, sourceChannel: "email", sourceReference: "email:FEHA-3", senderPhone: null },
    classification,
    501,
  );
  assert.equal(both, phoneOnly);
  assert.equal(both, emailOnly);
});

test("same name and context with different resolved contacts stays different", () => {
  const classification = classifyCommercialInquiry(base);
  assert.notEqual(
    buildResolvedCommercialDemandKey(base, classification, 501),
    buildResolvedCommercialDemandKey(
      { ...base, senderEmail: "other@example.com", senderPhone: "+966511111111" },
      classification,
      777,
    ),
  );
});

test("source references aggregate idempotently without duplicate values", () => {
  let refs = mergeSourceReferences([], "support-ticket:FEHA-1");
  refs = mergeSourceReferences(refs, "support-ticket:FEHA-2");
  refs = mergeSourceReferences(refs, "support-ticket:FEHA-1");
  assert.deepEqual(refs, ["support-ticket:FEHA-1", "support-ticket:FEHA-2"]);
});

test("concurrent intake Promise.all executes the create chain once", async () => {
  let ownerClaimed = false;
  let completed: Promise<Record<string, number>> | null = null;
  let resolveCompleted: ((value: Record<string, number>) => void) | null = null;
  const counts = {
    contact: 0,
    lead: 0,
    conversation: 0,
    brief: 0,
    draft: 0,
    approval: 0,
  };

  const acquire = async () => {
    if (!ownerClaimed) {
      ownerClaimed = true;
      completed = new Promise((resolve) => {
        resolveCompleted = resolve;
      });
      return { owner: true, snapshot: { id: 1 } };
    }
    return { owner: false, snapshot: { id: 1 } };
  };

  const runOwner = async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
    counts.contact += 1;
    counts.lead += 1;
    counts.conversation += 1;
    counts.brief += 1;
    counts.draft += 1;
    counts.approval += 1;
    const result = {
      contactId: 1,
      leadId: 2,
      conversationId: 3,
      briefId: 4,
      draftMessageId: 5,
      approvalId: 6,
    };
    resolveCompleted?.(result);
    return result;
  };

  const waitForCompleted = async () => {
    assert.ok(completed);
    return completed;
  };

  const results = await Promise.all(
    Array.from({ length: 20 }, () =>
      runWithWorkflowLock({ acquire, runOwner, waitForCompleted }),
    ),
  );

  assert.deepEqual(counts, {
    contact: 1,
    lead: 1,
    conversation: 1,
    brief: 1,
    draft: 1,
    approval: 1,
  });
  assert.equal(new Set(results.map((result) => result.leadId)).size, 1);
  assert.equal(new Set(results.map((result) => result.conversationId)).size, 1);
  assert.equal(new Set(results.map((result) => result.briefId)).size, 1);
  assert.equal(new Set(results.map((result) => result.draftMessageId)).size, 1);
  assert.equal(new Set(results.map((result) => result.approvalId)).size, 1);
});
