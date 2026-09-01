import test from "node:test";
import assert from "node:assert/strict";

import {
  DANA_AGENT,
  approvalLevelForExternalDraft,
  buildCommercialDemandKey,
  buildDanaBrief,
  buildExternalDraft,
  classifyCommercialInquiry,
  normalizeEmail,
  normalizePhone,
  rankEligibleTalents,
  type CommercialInquiry,
  type TalentCandidate,
} from "./domain.ts";

const fehaLike: CommercialInquiry = {
  sourceChannel: "support",
  sourceReference: "support-ticket:FEHA-1",
  occurredAt: "2026-09-01T09:00:00Z",
  senderName: "Feha's Collection",
  senderEmail: "CASTING@FEHA.EXAMPLE ",
  senderPhone: "055 555 5555",
  organizationName: "Feha's Abaya",
  subject: "مودل لمحتوى العباءات",
  category: "general_inquiry",
  message: "نحتاج عارضة مودل أنثى في جدة بشكل شهري لتصوير ريلز وفيديو سوشيال ميديا.",
};

const duplicateFehaLike: CommercialInquiry = {
  ...fehaLike,
  sourceReference: "support-ticket:FEHA-2",
  occurredAt: "2026-09-02T12:00:00Z",
  senderEmail: "casting@feha.example",
  senderPhone: "+966555555555",
  message: "نحتاج مودل عارضة في جدة شهرياً لتصوير Reels ومحتوى social video.",
};

const eligibleTalents: TalentCandidate[] = [
  {
    id: 101,
    name: "Eligible Jeddah Model",
    primaryRole: "model",
    cityEn: "Jeddah",
    gender: "female",
    modelingTypes: ["commercial", "fashion"],
    availabilityStatus: "available",
    published: true,
    status: "approved",
  },
  {
    id: 102,
    name: "Unpublished Model",
    primaryRole: "model",
    cityEn: "Jeddah",
    gender: "female",
    published: false,
    status: "draft",
  },
  {
    id: 103,
    name: "Eligible Actor",
    primaryRole: "actor",
    cityEn: "Jeddah",
    gender: "female",
    published: true,
    status: "approved",
  },
];

test("commercial support is classified while normal support stays support", () => {
  assert.equal(classifyCommercialInquiry(fehaLike).commercial, true);
  assert.deepEqual(
    classifyCommercialInquiry({ ...fehaLike, subject: "مشكلة تسجيل الدخول", message: "لا أستطيع الدخول إلى حسابي", category: "technical_issue" }),
    { commercial: false, intent: "normal_support", confidence: 0.9, signals: [] },
  );
});

test("duplicate support tickets for the same demand produce the same demand key", () => {
  assert.equal(buildCommercialDemandKey(fehaLike), buildCommercialDemandKey(duplicateFehaLike));
});

test("contact resolution normalizes email and Saudi phone identifiers", () => {
  assert.equal(normalizeEmail(" CASTING@FEHA.EXAMPLE "), "casting@feha.example");
  assert.equal(normalizePhone("055 555 5555"), "+966555555555");
  assert.equal(normalizePhone("00966 55 555 5555"), "+966555555555");
});

test("two different clients are never merged by name or context alone", () => {
  const otherClient = { ...fehaLike, sourceReference: "support-ticket:OTHER", senderEmail: "other@example.com", senderPhone: "+966511111111" };
  assert.notEqual(buildCommercialDemandKey(fehaLike), buildCommercialDemandKey(otherClient));
});

test("same client with a materially different commercial context gets a different demand key", () => {
  const actorProject = { ...fehaLike, sourceReference: "support-ticket:ACTOR", subject: "ممثل في الرياض", message: "نحتاج ممثل في الرياض لمشروع تصوير" };
  assert.notEqual(buildCommercialDemandKey(fehaLike), buildCommercialDemandKey(actorProject));
});

test("one demand key is the idempotency anchor for one lead/workflow/conversation chain", () => {
  const a = buildCommercialDemandKey(fehaLike);
  const b = buildCommercialDemandKey(duplicateFehaLike);
  assert.equal(`dana:commercial-intake:${a}`, `dana:commercial-intake:${b}`);
  assert.equal(`demand:${a}`, `demand:${b}`);
});

test("Dana builds one structured brief from the commercial inquiry", () => {
  const brief = buildDanaBrief(fehaLike);
  assert.equal(brief.talentType, "model");
  assert.equal(brief.city, "Jeddah");
  assert.equal(brief.status, "complete");
  assert.equal(brief.requirements.recurring, true);
  assert.equal(brief.requirements.social_content, true);
  assert.equal(brief.requirements.gender, "female");
});

test("duplicate source reference is metadata, not part of brief identity", () => {
  const one = buildDanaBrief(fehaLike);
  const two = buildDanaBrief(duplicateFehaLike);
  assert.equal(one.talentType, two.talentType);
  assert.equal(one.city, two.city);
  assert.equal(buildCommercialDemandKey(fehaLike), buildCommercialDemandKey(duplicateFehaLike));
});

test("shortlist uses only actual eligible talent records and gives reviewable reasons", () => {
  const result = rankEligibleTalents(buildDanaBrief(fehaLike), eligibleTalents, 1);
  assert.equal(result.status, "matched");
  if (result.status !== "matched") return;
  assert.deepEqual(result.matches.map((match) => match.talentId), [101]);
  assert.ok(result.matches[0].reasons.includes("published_and_eligible"));
  assert.ok(result.matches[0].reasons.includes("city:Jeddah"));
});

test("insufficient eligible talent returns insufficient_matches and never invents names", () => {
  assert.deepEqual(rankEligibleTalents(buildDanaBrief(fehaLike), eligibleTalents.filter((talent) => talent.id !== 101), 1), {
    status: "insufficient_matches",
    matches: [],
  });
});

test("external draft uses MLAMH external identity and is only a prepared deliverable", () => {
  const brief = buildDanaBrief(fehaLike);
  const shortlist = rankEligibleTalents(brief, eligibleTalents, 1);
  const draft = buildExternalDraft(fehaLike, brief, shortlist);
  assert.equal(draft.senderIdentity, DANA_AGENT.externalIdentity);
  assert.equal(draft.channel, "support");
  assert.ok(draft.content.length > 20);
  assert.equal("send" in draft, false);
});

test("ordinary external reply requires approval", () => {
  assert.equal(approvalLevelForExternalDraft("Thank you. We prepared a talent shortlist for your review."), "approval_required");
});

test("pricing, discount, partnership and legal/commercial commitments are CEO only", () => {
  assert.equal(approvalLevelForExternalDraft("We confirm this partnership and pricing agreement."), "ceo_only");
  assert.equal(approvalLevelForExternalDraft("نؤكد الخصم والاتفاقية التجارية"), "ceo_only");
});

test("commercial intake contract is channel-agnostic while Support is only the first adapter", () => {
  for (const channel of ["support", "email", "instagram", "whatsapp", "website", "linkedin"] as const) {
    const input = { ...fehaLike, sourceChannel: channel, sourceReference: `${channel}:123` };
    assert.equal(classifyCommercialInquiry(input).commercial, true);
    assert.equal(buildDanaBrief(input).talentType, "model");
  }
});
