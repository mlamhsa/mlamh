import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  DANA_AGENT,
  approvalLevelForExternalDraft,
  buildCommercialDemandKey,
  buildDanaBrief,
  buildExternalDraft,
  buildQualifiedTalentShortlist as buildShortlistFromSupply,
  classifyCommercialInquiry,
  normalizeEmail,
  normalizePhone,
  toTalentSupplyBrief,
  type CommercialInquiry,
} from "./domain.ts";
import {
  evaluateTalentSupplyForBrief,
  type BriefTalent,
} from "../../talent/supply.ts";

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

const qualifiedJeddahModel: BriefTalent = {
  id: 101,
  name_en: "Qualified Jeddah Model",
  primary_role: "model",
  city_en: "Jeddah",
  gender: "female",
  modeling_types: ["commercial", "fashion"],
  availability_status: "available",
  image_url: "https://cdn.example.com/talent-101.jpg",
  published: true,
  status: "approved",
  profile_approval_status: "approved",
  profile_status: "active",
};

const supplyTalents: BriefTalent[] = [
  qualifiedJeddahModel,
  {
    ...qualifiedJeddahModel,
    id: 102,
    name_en: "No Image Model",
    image_url: null,
    gallery_images: [],
  },
  {
    ...qualifiedJeddahModel,
    id: 103,
    name_en: "Pending Model",
    profile_approval_status: "pending",
  },
  {
    ...qualifiedJeddahModel,
    id: 104,
    name_en: "Riyadh Model",
    city_en: "Riyadh",
  },
  {
    ...qualifiedJeddahModel,
    id: 105,
    name_en: "Missing Gender Model",
    gender: null,
  },
  {
    ...qualifiedJeddahModel,
    id: 106,
    name_en: "Qualified Jeddah Model 2",
    gender: "female",
  },
];

function buildQualifiedTalentShortlist(
  brief: ReturnType<typeof buildDanaBrief>,
  candidates: BriefTalent[],
) {
  const supply = evaluateTalentSupplyForBrief(
    toTalentSupplyBrief(brief),
    candidates,
  );
  return buildShortlistFromSupply(brief, supply);
}

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

test("sufficient qualified supply produces a matched shortlist", () => {
  const result = buildQualifiedTalentShortlist(
    buildDanaBrief(fehaLike),
    [qualifiedJeddahModel],
  );
  assert.equal(result.status, "matched");
  assert.deepEqual(result.matches.map((match) => match.talentId), [101]);
  assert.ok(result.matches[0].reasons.includes("qualified"));
  assert.ok(result.matches[0].reasons.includes("city:Jeddah"));
  assert.deepEqual(result.supplyGap, {
    needed: 1,
    available: 1,
    missing: 0,
    reasons: [],
  });
});

test("Dana never shortlists a talent without a valid image", () => {
  const result = buildQualifiedTalentShortlist(
    buildDanaBrief(fehaLike),
    [supplyTalents[1]],
  );
  assert.equal(result.status, "insufficient_matches");
  assert.deepEqual(result.matches, []);
  assert.ok(result.supplyGap.reasons.includes("not_qualified:missing_image"));
});

test("Dana never shortlists an unapproved or unqualified talent", () => {
  const result = buildQualifiedTalentShortlist(
    buildDanaBrief(fehaLike),
    [supplyTalents[2]],
  );
  assert.deepEqual(result.matches, []);
  assert.ok(
    result.supplyGap.reasons.includes(
      "not_qualified:missing_profile_approval",
    ),
  );
});

test("Jeddah brief never shortlists a Riyadh talent", () => {
  const result = buildQualifiedTalentShortlist(
    buildDanaBrief(fehaLike),
    [supplyTalents[3]],
  );
  assert.deepEqual(result.matches, []);
  assert.ok(result.supplyGap.reasons.includes("city_mismatch"));
});

test("missing required gender is rejected without inference", () => {
  const result = buildQualifiedTalentShortlist(
    buildDanaBrief(fehaLike),
    [supplyTalents[4]],
  );
  assert.deepEqual(result.matches, []);
  assert.ok(result.supplyGap.reasons.includes("missing_required_gender"));
});

test("insufficient supply keeps only real sendable matches and returns the exact gap", () => {
  const brief = { ...buildDanaBrief(fehaLike), talentCount: 5 };
  const result = buildQualifiedTalentShortlist(brief, [
    qualifiedJeddahModel,
    supplyTalents[5],
  ]);
  assert.equal(result.status, "insufficient_matches");
  assert.deepEqual(
    result.matches.map((match) => match.talentName),
    ["Qualified Jeddah Model", "Qualified Jeddah Model 2"],
  );
  assert.deepEqual(result.supplyGap, {
    needed: 5,
    available: 2,
    missing: 3,
    reasons: ["insufficient_matches"],
  });
});

test("supply gap preserves actual qualification and brief rejection reasons", () => {
  const brief = { ...buildDanaBrief(fehaLike), talentCount: 5 };
  const result = buildQualifiedTalentShortlist(brief, [
    qualifiedJeddahModel,
    supplyTalents[5],
    supplyTalents[1],
    supplyTalents[3],
    supplyTalents[4],
  ]);

  assert.equal(result.status, "insufficient_matches");
  assert.deepEqual(
    result.matches.map((match) => match.talentId),
    [101, 106],
  );
  assert.equal(result.supplyGap.needed, 5);
  assert.equal(result.supplyGap.available, 2);
  assert.equal(result.supplyGap.missing, 3);
  assert.ok(result.supplyGap.reasons.includes("not_qualified:missing_image"));
  assert.ok(result.supplyGap.reasons.includes("city_mismatch"));
  assert.ok(result.supplyGap.reasons.includes("missing_required_gender"));
});

test("shortlist never invents a talent name", () => {
  const unnamed = {
    ...qualifiedJeddahModel,
    id: 107,
    name_en: null,
    name_ar: null,
    display_name_en: null,
    display_name_ar: null,
  };
  const result = buildQualifiedTalentShortlist(buildDanaBrief(fehaLike), [
    unnamed,
  ]);
  assert.deepEqual(result.matches, []);
  assert.ok(result.supplyGap.reasons.includes("not_qualified:missing_name"));
});

test("external draft uses MLAMH external identity and is only a prepared deliverable", () => {
  const brief = buildDanaBrief(fehaLike);
  const shortlist = buildQualifiedTalentShortlist(brief, [
    qualifiedJeddahModel,
  ]);
  const draft = buildExternalDraft(fehaLike, brief, shortlist);
  assert.equal(draft.senderIdentity, DANA_AGENT.externalIdentity);
  assert.equal(draft.channel, "support");
  assert.ok(draft.content.length > 20);
  assert.equal("send" in draft, false);
});

test("ordinary external reply requires approval", () => {
  assert.equal(approvalLevelForExternalDraft("Thank you. We prepared a talent shortlist for your review."), "approval_required");
});

test("Dana supply integration stays approval-gated and never sends externally", () => {
  const serviceSource = readFileSync(
    new URL("./service.ts", import.meta.url),
    "utf8",
  );

  assert.match(serviceSource, /getTalentSupplyForBrief\(toTalentSupplyBrief\(brief\)\)/);
  assert.doesNotMatch(serviceSource, /loadEligibleTalents/);
  assert.match(serviceSource, /event_name:[\s\S]*"talent_supply_gap"/);
  assert.ok((serviceSource.match(/talent_supply_gap/g) ?? []).length >= 5);
  assert.match(serviceSource, /delivery_status:\s*"draft"/);
  assert.match(serviceSource, /status:\s*"pending"/);
  assert.match(serviceSource, /external_execution:\s*false/);
  assert.doesNotMatch(serviceSource, /external_execution_enabled/);
  assert.doesNotMatch(serviceSource, /delivery_status:\s*"sent"/);
  assert.doesNotMatch(serviceSource, /Faisal/i);
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
