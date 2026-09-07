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

test("Talent Growth diagnoses activation from existing telemetry without writing Production data", () => {
  const page = source("app/admin/marketing/talent-growth/page.tsx");
  assert.match(page, /buildTalentActivationFunnel/);
  assert.match(page, /talentActivationSummary/);
  assert.match(page, /talent_profile_recovery_reminder_sent/);
  assert.match(page, /incomplete_registration_reminder_sent/);
  assert.match(page, /Account-role clarity/);
  assert.match(page, /account_type_selected/);
  assert.doesNotMatch(page, /\.insert\(/);
  assert.doesNotMatch(page, /\.upsert\(/);
  assert.doesNotMatch(page, /\.update\(/);
  assert.doesNotMatch(page, /\.delete\(/);
});

test("Account-type selection records governed role telemetry only after a valid path is persisted", () => {
  const page = source("app/[locale]/join/account-type/page.tsx");
  const eventTypes = source("lib/events/event-types.ts");
  assert.match(eventTypes, /account_type_selected/);
  assert.match(page, /recordAccountTypeSelection/);
  assert.match(page, /EVENT_TARGETS\.AUTH_USER/);
  assert.match(page, /source:\s*"join_account_type"/);
  assert.match(page, /accountType:\s*"talent"/);
  assert.match(page, /accountType:\s*"publisher"/);
  assert.match(page, /publisher_intent_confirmed/);
  assert.match(page, /allowedPublisherTypes\.has\(publisherType\)/);
});

test("Opportunity sharing creates first-party attribution only after a real share path", () => {
  const share = source("components/opportunities/OpportunityShareButton.tsx");
  const view = source("lib/actions/track-opportunity-view.ts");
  assert.match(share, /mlamh_source/);
  assert.match(share, /opportunity_share/);
  assert.match(share, /mlamh_channel/);
  assert.match(share, /utm_source/);
  assert.match(share, /utm_medium/);
  assert.match(share, /utm_campaign/);
  assert.match(share, /await navigator\.share/);
  assert.match(share, /trackShare\("native"\)/);
  assert.match(view, /ALLOWED_SHARE_CHANNELS/);
  assert.match(view, /acquisition_source/);
  assert.match(view, /acquisition_channel/);
});

test("Opportunity Growth reuses Dana supply snapshots and stays read-only", () => {
  const page = source("app/admin/marketing/opportunity-growth/page.tsx");
  assert.match(page, /talent_supply_gap/);
  assert.match(page, /opportunity_shared/);
  assert.match(page, /acquisition_source/);
  assert.match(page, /Dana's persisted matching results/);
  assert.doesNotMatch(page, /getTalentSupplyForBrief/);
  assert.doesNotMatch(page, /\.insert\(/);
  assert.doesNotMatch(page, /\.upsert\(/);
  assert.doesNotMatch(page, /\.update\(/);
  assert.doesNotMatch(page, /\.delete\(/);
});

test("Publisher Growth establishes a read-only CRO baseline and keeps opportunity creation outside funnel math", () => {
  const page = source("app/admin/marketing/publisher-growth/page.tsx");
  const diagnostics = source("lib/marketing/growth/publisher-activation.ts");
  assert.match(page, /buildPublisherActivationFunnel/);
  assert.match(page, /publisherActivationSummary/);
  assert.match(page, /opportunityPublishers/);
  assert.match(page, /CRO BASELINE/);
  assert.match(diagnostics, /opportunityActivation/);
  assert.doesNotMatch(diagnostics, /ordered.*opportunityPublishers/);
  assert.doesNotMatch(page, /\.insert\(/);
  assert.doesNotMatch(page, /\.upsert\(/);
  assert.doesNotMatch(page, /\.update\(/);
  assert.doesNotMatch(page, /\.delete\(/);
});

test("Talent SEO fallback does not advertise private media to public crawlers", () => {
  const metadata = source("lib/seo/talent-metadata.ts");
  assert.match(metadata, /المعلومات المهنية العامة/);
  assert.match(metadata, /public professional information/);
  assert.doesNotMatch(metadata, /الملف المهني والصور والمعلومات/);
});
