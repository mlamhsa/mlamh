import test from "node:test";
import assert from "node:assert/strict";

import {
  buildDanaBrief,
  toTalentSupplyBrief,
  type CommercialInquiry,
} from "./domain.ts";
import { evaluateTalentSupplyForBrief, type BriefTalent } from "../../talent/supply.ts";

function inquiry(message: string): CommercialInquiry {
  return {
    sourceChannel: "website",
    sourceReference: "test:multi-country",
    occurredAt: "2026-09-03T00:00:00Z",
    senderName: "Client",
    subject: "Casting request",
    message,
  };
}

const qualifiedDubaiTalent: BriefTalent = {
  id: 901,
  name_en: "Dubai Model",
  primary_role: "model",
  city_en: "Dubai",
  gender: "female",
  availability_status: "available",
  image_url: "https://cdn.example.com/dubai-model.jpg",
  published: true,
  status: "approved",
  profile_approval_status: "approved",
  profile_status: "active",
  base_country_code: "AE",
};

test("Dana extracts country and city from a UAE commercial brief", () => {
  const brief = buildDanaBrief(inquiry("نحتاج مودل أنثى في دبي لتصوير محتوى"));
  assert.equal(brief.countryCode, "AE");
  assert.equal(brief.city, "Dubai");
  assert.equal(brief.talentType, "model");
  assert.equal(brief.status, "complete");
});

test("Dana passes country context into Qualified Supply", () => {
  const brief = buildDanaBrief(inquiry("نحتاج مودل أنثى في دبي لتصوير محتوى"));
  const supplyBrief = toTalentSupplyBrief(brief);
  assert.equal(supplyBrief.opportunity_country_code, "AE");
  assert.equal(supplyBrief.city, "Dubai");
});

test("UAE Dana brief accepts an explicitly UAE-based talent", () => {
  const brief = toTalentSupplyBrief(
    buildDanaBrief(inquiry("نحتاج مودل أنثى في دبي لتصوير محتوى")),
  );
  const supply = evaluateTalentSupplyForBrief(brief, [qualifiedDubaiTalent]);
  assert.equal(supply.sendableTalents.length, 1);
});

test("UAE Dana brief rejects legacy countryless Saudi-compatible talent", () => {
  const brief = toTalentSupplyBrief(
    buildDanaBrief(inquiry("نحتاج مودل أنثى في دبي لتصوير محتوى")),
  );
  const legacyTalent: BriefTalent = {
    ...qualifiedDubaiTalent,
    id: 902,
    name_en: "Legacy Talent",
    base_country_code: null,
  };
  const supply = evaluateTalentSupplyForBrief(brief, [legacyTalent]);
  assert.equal(supply.sendableTalents.length, 0);
  assert.ok(supply.evaluations[0].reasons.includes("market_mismatch"));
});

test("cross-border talent is eligible only through an explicit work market", () => {
  const brief = toTalentSupplyBrief(
    buildDanaBrief(inquiry("نحتاج مودل أنثى في دبي لتصوير محتوى")),
  );
  const crossBorderTalent: BriefTalent = {
    ...qualifiedDubaiTalent,
    id: 903,
    name_en: "Cross Border Talent",
    base_country_code: "SA",
    work_market_codes: ["AE"],
  };
  const supply = evaluateTalentSupplyForBrief(brief, [crossBorderTalent]);
  assert.equal(supply.sendableTalents.length, 1);
});

test("legacy Saudi Dana brief continues to resolve Saudi market", () => {
  const brief = buildDanaBrief(inquiry("نحتاج مودل أنثى في جدة لتصوير محتوى"));
  assert.equal(brief.countryCode, "SA");
  assert.equal(brief.city, "Jeddah");
  assert.equal(toTalentSupplyBrief(brief).opportunity_country_code, "SA");
});
