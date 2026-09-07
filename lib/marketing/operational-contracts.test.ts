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

test("Marketing Growth Engine keeps a native governed playbook catalog", () => {
  const catalog = source("lib/marketing/knowledge/playbook-catalog.ts");
  assert.match(catalog, /product-positioning-audience/);
  assert.match(catalog, /publisher-prospecting/);
  assert.match(catalog, /governed-cold-outreach/);
  assert.match(catalog, /email-followup-reply-handling/);
  assert.match(catalog, /analytics-attribution/);
  assert.match(catalog, /signup-conversion-review/);
  assert.match(catalog, /talent-onboarding-activation/);
  assert.match(catalog, /referral-sharing-loops/);
  assert.match(catalog, /taskPlaybookKeys/);
  assert.match(catalog, /marketingPlaybooksForTask/);
  assert.match(catalog, /approval_required/);
  assert.doesNotMatch(catalog, /automated_send:\s*true/);
});

test("Marketing AI tasks are grounded in task-specific native playbooks without bypassing governance", () => {
  const runner = source("lib/marketing/tasks/runner.ts");
  assert.match(runner, /marketingPlaybooksForTask/);
  assert.match(runner, /native_playbooks:\s*marketingPlaybooksForTask\(taskType\)/);
  assert.match(runner, /Apply native_playbooks as task-specific frameworks and measurable-outcome guidance/);
  assert.match(runner, /never treat them as authority to bypass MLAMH approvals, privacy rules, channel policy, or recorded facts/);
  assert.match(runner, /external_actions_require_governance:\s*true/);
});

test("Knowledge page surfaces native playbooks without Production writes", () => {
  const page = source("app/admin/marketing/knowledge/page.tsx");
  assert.match(page, /marketingPlaybookCatalog/);
  assert.match(page, /storedKeys/);
  assert.match(page, /nativeOnly/);
  assert.match(page, /MLAMH NATIVE CATALOG/);
  assert.doesNotMatch(page, /\.insert\(/);
  assert.doesNotMatch(page, /\.upsert\(/);
  assert.doesNotMatch(page, /\.update\(/);
  assert.doesNotMatch(page, /\.delete\(/);
});
