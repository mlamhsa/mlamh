import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { buildChannelQuality } from "./channel-quality.ts";

function source(path: string) {
  return readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8");
}

test("channel quality ranks verified demand and outcome evidence above traffic-only activity", () => {
  const rows = buildChannelQuality([
    { event_name: "page_view", source: "instagram", campaign: "talent-launch" },
    { event_name: "registration_completed", source: "instagram", campaign: "talent-launch" },
    { event_name: "application_submitted", source: "instagram", campaign: "talent-launch" },
    { event_name: "brief_received", source: "support" },
    { event_name: "page_view", source: "tiktok", campaign: "awareness" },
  ]);

  assert.equal(rows[0].source, "support");
  assert.equal(rows[0].evidenceTier, "demand_proven");
  assert.equal(rows[0].briefs, 1);
  assert.equal(rows[0].briefRate, null);

  const instagram = rows.find((row) => row.source === "instagram");
  assert.ok(instagram);
  assert.equal(instagram.evidenceTier, "talent_conversion");
  assert.equal(instagram.registrationRate, 100);
  assert.equal(instagram.applicationRate, 100);

  const tiktok = rows.find((row) => row.source === "tiktok");
  assert.ok(tiktok);
  assert.equal(tiktok.evidenceTier, "traffic_only");
});

test("channel quality never fabricates conversion percentages without a denominator", () => {
  const [row] = buildChannelQuality([
    { event_name: "registration_completed", source: "linkedin" },
    { event_name: "application_submitted", source: "linkedin" },
  ]);

  assert.equal(row.registrationRate, null);
  assert.equal(row.applicationRate, 100);
  assert.equal(row.briefRate, null);
});

test("current governed support intake emits one verified brief outcome only for a newly prepared demand", () => {
  const adapter = source("lib/marketing/dana/support-adapter.ts");
  assert.match(adapter, /eventName:\s*"brief_received"/);
  assert.match(adapter, /!result\.deduplicated/);
  assert.match(adapter, /outcome_verified_server_side:\s*true/);
  assert.match(adapter, /trackMarketingEvent/);
});
