import assert from "node:assert/strict";
import test from "node:test";

import { buildDanaChannelDrafts, buildDanaExecutiveSummary, detectDanaClientLanguage } from "./client-response.ts";

test("detectDanaClientLanguage follows the customer's dominant language", () => {
  assert.equal(detectDanaClientLanguage("طلب مودل", "نبحث عن مودل في جدة للتصوير الشهري"), "ar");
  assert.equal(detectDanaClientLanguage("Monthly model request", "We need a female model in Jeddah for recurring shoots"), "en");
});

test("Dana Arabic drafts localize city and explain requested alternatives", () => {
  const drafts = buildDanaChannelDrafts({ language: "ar", senderName: "عميل", talentType: "model", city: "Jeddah", matchNames: ["Yara"], supplyMissing: 0, alternativesRequested: true });
  assert.match(drafts.email, /شكرًا لتواصلكم مع ملامح/);
  assert.match(drafts.email, /Yara في جدة/);
  assert.match(drafts.email, /بدائل للمقارنة/);
  assert.match(drafts.whatsapp, /معكم فريق ملامح/);
  assert.match(drafts.whatsapp, /ترشيحات إضافية مطابقة/);
  assert.doesNotMatch(drafts.email, /Brief|Jeddah/);
  assert.notEqual(drafts.email, drafts.whatsapp);
});

test("executive summary explains demand, supply and comparison gap to the CEO", () => {
  const summary = buildDanaExecutiveSummary({ language: "ar", talentType: "model", talentCount: 1, city: "Jeddah", recurring: true, socialContent: true, compensation: null, matchCount: 1, supplyMissing: 0, alternativesRequested: true });
  assert.match(summary, /العميل يطلب/);
  assert.match(summary, /في جدة/);
  assert.match(summary, /وجدت Dana 1 موهبة/);
  assert.match(summary, /لا توجد بدائل إضافية مطابقة جاهزة حاليًا/);
  assert.doesNotMatch(summary, /Brief|Jeddah/);
});
