import assert from "node:assert/strict";
import test from "node:test";

import { buildDanaChannelDrafts, buildDanaExecutiveSummary, detectDanaClientLanguage } from "./client-response.ts";

test("detectDanaClientLanguage follows the customer's dominant language", () => {
  assert.equal(detectDanaClientLanguage("طلب مودل", "نبحث عن مودل في جدة للتصوير الشهري"), "ar");
  assert.equal(detectDanaClientLanguage("Monthly model request", "We need a female model in Jeddah for recurring shoots"), "en");
});

test("Dana channel drafts keep Arabic inquiries Arabic and adapt by channel", () => {
  const drafts = buildDanaChannelDrafts({ language: "ar", senderName: "عميل", talentType: "model", city: "Jeddah", matchNames: ["Yara"], supplyMissing: 0 });
  assert.match(drafts.email, /شكرًا لتواصلكم مع ملامح/);
  assert.match(drafts.whatsapp, /معكم فريق ملامح/);
  assert.notEqual(drafts.email, drafts.whatsapp);
});

test("executive summary explains demand and supply to the CEO", () => {
  const summary = buildDanaExecutiveSummary({ language: "ar", talentType: "model", talentCount: 1, city: "Jeddah", recurring: true, socialContent: true, compensation: null, matchCount: 1, supplyMissing: 0 });
  assert.match(summary, /العميل يطلب/);
  assert.match(summary, /Dana وجدت 1 موهبة/);
});
