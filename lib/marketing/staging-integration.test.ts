import test from "node:test";
import assert from "node:assert/strict";

const url = "https://aempbsenymvxwbxkxdxf.supabase.co";
const key = "sb_publishable_oIsYeiVV51QCmJEUutWPgg_1tMGj3jN";
const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
};

async function rest(path: string, init?: RequestInit) {
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: { ...headers, ...(init?.headers ?? {}) },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${response.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

test("PR #128 reaches isolated Staging and preserves governance", async () => {
  const opportunities = await rest("opportunities?id=eq.1&select=id,title,status,published,role_requirements");
  assert.equal(opportunities.length, 1);
  const opportunity = opportunities[0];
  assert.equal(opportunity.status, "draft");
  assert.equal(opportunity.published, false);
  assert.equal(opportunity.role_requirements?.managed_by, "mlamh");

  const originalTitle = opportunity.title;
  const qaTitle = `${originalTitle} [CI-QA]`;
  const updated = await rest("opportunities?id=eq.1&select=id,title,status,published", {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ title: qaTitle }),
  });
  assert.equal(updated[0]?.title, qaTitle);
  assert.equal(updated[0]?.status, "draft");
  assert.equal(updated[0]?.published, false);

  const restored = await rest("opportunities?id=eq.1&select=id,title,status,published", {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ title: originalTitle }),
  });
  assert.equal(restored[0]?.title, originalTitle);
  assert.equal(restored[0]?.published, false);

  const outreach = await rest("marketing_outreach?id=eq.1&select=id,send_status,metadata");
  assert.equal(outreach.length, 1);
  assert.equal(outreach[0].send_status, "draft");
  assert.equal(outreach[0].metadata?.execution_mode, "manual_linkedin");
  assert.equal(outreach[0].metadata?.sender_profile_name, "Sawsan Ahdadi");
  assert.equal(outreach[0].metadata?.sender_role, "Business Development");
  assert.equal(outreach[0].metadata?.automated_send, false);

  const settings = await rest("marketing_settings?key=eq.external_execution_enabled&select=key,value");
  assert.equal(settings.length, 1);
  assert.equal(settings[0].value?.enabled, false);
});
