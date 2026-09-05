import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path: string) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

test("managed brief conversion uses correct Arabic lam grammar", () => {
  const page = source("app/admin/opportunities/new/page.tsx");
  assert.match(page, /const title = `مطلوب \$\{talent\} ل\$\{project\}\$\{citySuffix\}`;/);
  assert.doesNotMatch(page, /لـ\$\{project\}/);
});

test("managed opportunity edit stays restricted to MLAMH unpublished drafts and explicit publish intent", () => {
  const action = source("lib/actions/update-admin-localized-opportunity.ts");
  assert.match(action, /roleRequirements\.managed_by !== "mlamh"/);
  assert.match(action, /existing\.published \|\| !\["draft", "needs_changes"\]\.includes\(existing\.status\)/);
  assert.match(action, /const publishNow = formData\.get\("publish_now"\) === "true"/);
  assert.match(action, /status: publishNow \? "published" : "draft"/);
  assert.match(action, /published: publishNow/);
});

test("lead workspace requires name, professional role, and verified channel before outreach", () => {
  const page = source("app/admin/marketing/leads/[id]/page.tsx");
  assert.match(page, /const outreachReady = hasNamedContact && Boolean\(role\) && \(hasLinkedIn \|\| hasEmail\);/);
});

test("Layan LinkedIn handoff stays manual under Sawsan and never becomes automated send", () => {
  const materialize = source("lib/marketing/tasks/materialize.ts");
  assert.match(materialize, /sender_profile:\s*"sawsan"/);
  assert.match(materialize, /sender_profile_name:\s*"Sawsan Ahdadi"/);
  assert.match(materialize, /sender_role:\s*"Business Development"/);
  assert.match(materialize, /execution_mode:\s*"manual_linkedin"/);
  assert.match(materialize, /automated_send:\s*false/);
});

test("Salman research review requires sourced professional contact evidence", () => {
  const actions = source("app/admin/marketing/leads/[id]/research/actions.ts");
  assert.match(actions, /sourceEvidence/);
  assert.match(actions, /host === "linkedin\.com" && isPersonProfile/);
  assert.ok(actions.includes(String.raw`/^\/in\/[^/]+\/?$/i`));
  assert.match(actions, /A sourced professional role\/title is required before approval/);
  assert.match(actions, /Claim-level source evidence is required before a researched contact can become outreach-ready/);
  assert.match(actions, /marketing_contacts/);
});
