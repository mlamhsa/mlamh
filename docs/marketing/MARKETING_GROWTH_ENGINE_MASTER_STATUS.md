# MLAMH Marketing Growth Engine — Master Status

Last baseline: 2026-09-07
Scope: Online marketing growth system for MLAMH

## Operating rule
Work progresses in one ordered stream. A task moves to DONE only when implementation or evidence is verified. Related changes are batched to reduce unnecessary deployments.

## Foundation / Marketing Skills Integration
- DONE — Marketing Hub structure reconciliation.
- DONE — Marketing Command Center verification.
- DONE — Email operations / inbound routing / analytics feedback loop verification.
- DONE — Knowledge / Playbooks layer verification.
- DONE — Marketing Skills gap mapping.
- DONE — Canonical Product Marketing Context V1.
- DONE — Marketing Skills integration map.
- DONE — MLAMH-native governed playbook catalog.
- DONE — Knowledge page read-only native playbook fallback; stored database playbooks remain authoritative by key.
- DONE — Task-specific playbook mapping for existing Marketing AI workflows.
- DONE — Runtime grounding so existing AI tasks receive relevant native playbooks without a parallel execution path.
- DONE — Governance contract tests covering playbook integration and no Knowledge-page Production writes.

## Existing verified MLAMH systems to reuse
- Marketing Command Center.
- AI Marketing Team.
- Tasks and approvals.
- Leads and outreach.
- Inbox and email operations.
- Follow-ups.
- Briefs.
- Campaigns and content.
- Social and creative surfaces.
- Analytics and experiments.
- Talent Growth, Publisher Growth, Opportunity Growth, Channel Quality and Demand Quality.
- Knowledge / Playbooks.
- Integrations and marketing control.

## Priority Growth Engine workstreams
### A. Publisher demand engine
Status: CORE QUALITY LOOP IMPLEMENTED
- DONE — Prospecting framework mapped into the existing Leads / Research flow.
- DONE — Governed cold-outreach framework mapped into existing Outreach tasks.
- DONE — Reply classification and routing already verified in the existing email engine.
- DONE — Follow-up / reply handling framework mapped into existing lifecycle flow.
- DONE — Publisher Growth baseline measures publisher account -> profile -> review -> approval progression.
- DONE — Publisher opportunity activation is measured separately from the review funnel so activity cannot distort funnel drop-off math.
- DONE — The current governed Support commercial-intake adapter emits one `brief_received` outcome only when Dana creates a new prepared demand; deduplicated intake does not create a second outcome.
- DONE — Brief outcome attribution failure is non-blocking for the commercial intake workflow.
- DONE — Demand Quality measures completed lead research, outreach readiness, prepared outreach, sent outreach, recorded replies, explicit positive replies, briefs and opportunities using distinct Lead IDs.
- DONE — Outreach readiness reuses the existing Lead Workspace contract: named contact + professional role/title + verified email or LinkedIn channel.
- DONE — Lead -> Brief and Brief -> Opportunity conversion are reported without fabricating percentages when a denominator is missing.
- DONE — The largest observed demand-pipeline drop is derived from recorded progression instead of a generic benchmark.
- DONE — Source-level Demand Quality shows which Lead source reaches ready, sent, reply and Brief outcomes.
- NEXT — Extend the same verified brief-outcome contract to additional commercial source adapters when those adapters are introduced or verified.
- NEXT — Use real Demand Quality evidence to improve the weakest research/outreach transition rather than increasing Lead volume blindly.

### B. Talent acquisition and activation
Status: CORE LOOP IMPLEMENTED
- DONE — Lifetime talent activation funnel upgraded from raw counts to conversion diagnostics.
- DONE — 7-day registration cohort added for completion, submission and approval progression.
- DONE — Largest current activation bottleneck is derived from observed funnel drop-off rather than guessed.
- DONE — Existing incomplete-registration and talent-profile recovery reminder telemetry is surfaced and reused instead of creating a duplicate lifecycle system.
- DONE — Funnel math is covered by unit tests, including zero-denominator and activity-overlap cases.
- DONE — Talent Growth remains read-only; no Production DML is introduced by the diagnostics page.
- DONE — Explicit account-role selection telemetry added at the governed join decision point.
- DONE — Talent Growth separates Talent vs Publisher selections from the instrumentation start date instead of inferring historical intent.
- DONE — Opportunity share actions already use the existing share event; shared links now carry first-party MLAMH attribution.
- DONE — Shared opportunity links also carry the existing UTM standard so they enter MLAMH's general attribution layer instead of remaining an isolated referral metric.
- DONE — Opportunity views can identify verified traffic arriving through a tracked MLAMH share link and channel.
- DONE — Opportunity Growth reports share activity, attributed shared-link views and views-per-share without claiming a messaging-platform click equals a visit.
- DONE — Qualified supply-gap reporting reuses Dana's persisted `talent_supply_gap` snapshot rather than running a parallel matching engine.
- DONE — Verified registration and application outcomes inherit sanitized first-party attribution after the product write succeeds.
- DEFERRED — Account-role correction telemetry until a governed correction flow exists; publisher share alone is not evidence of a mistake.

### C. Organic content and distribution
Status: VERIFIED FOUNDATION / MEASUREMENT GATED
- VERIFIED — Existing Content Studio has content objectives, AI drafts, copy -> creative -> approval -> publishing flow.
- VERIFIED — Existing Social Scheduler preserves approval before publishing and supports channel-specific execution.
- VERIFIED — Opportunity sharing provides an organic distribution path with first-party share/view measurement.
- DEFERRED — Per-content outcome attribution until an external publishing surface carries a verifiable first-party link/content identifier; current Buffer execution is text/media based and Instagram copy deliberately avoids raw MLAMH URLs.
- NEXT — Continue channel-level outcome measurement using existing UTM evidence; do not invent content-level clicks or conversions.

### D. SEO and discovery
Status: TECHNICAL BASELINE IMPLEMENTED / SA INDEX MARKET
- VERIFIED — Dynamic sitemap covers public locale roots, talent directory, opportunity directory, casting, guides, publisher pages, approved talent profiles, available talent categories/cities and opportunity intent routes.
- VERIFIED — Market SEO gating prevents exposing a disabled market through the sitemap; the current indexed SEO market remains Saudi Arabia (`SA`).
- VERIFIED — Robots excludes admin, API, auth, dashboards, login and join surfaces from indexing.
- VERIFIED — Talent profile metadata has canonical/hreflang, Open Graph, Twitter and robots controls.
- DONE — Talent metadata fallback no longer advertises private media/content to public crawlers; public metadata describes public professional details only.
- VERIFIED — Public talent projection hides private media/links unless the governed viewer access policy grants them.
- VERIFIED — Opportunity detail metadata has canonical/hreflang, Open Graph, Twitter and noindex for missing records.
- VERIFIED — Paid/open opportunity pages expose JobPosting schema with title, description, datePosted, validThrough, hiring organization and city; unpaid opportunities are intentionally excluded from JobPosting markup.
- DONE — Public opportunity records normalize `application_deadline -> deadline -> expires_at`, so legacy expiry data reaches the existing page/application status and JobPosting `validThrough` logic instead of silently appearing evergreen.
- DONE — Active opportunity sitemap and opportunity-intent sitemap now exclude records whose known application/expiry deadline has passed.
- POLICY — The current JobPosting `addressCountry: SA` remains aligned with the current `SEO_MARKET = SA`; it must become market-derived before another country becomes indexable.
- NEXT — Programmatic SEO only where pages have unique user value and real inventory.
- NEXT — AI-search visibility diagnostics after technical baseline is complete.

### E. Experimentation and CRO
Status: ACTIVE FOUNDATION
- DONE — Talent signup/activation baseline exists through Talent Growth lifetime + 7-day cohort diagnostics.
- DONE — Publisher signup/activation baseline exists through Publisher Growth lifetime + 7-day cohort diagnostics.
- DONE — Both baselines derive bottlenecks from recorded progression and avoid fabricated percentages when denominators do not exist.
- DONE — Attributed registration and application outcomes support source/campaign CRO analysis without accepting client-declared success events.
- DONE — Channel Quality ranks channels by deepest verified marketplace outcome rather than raw traffic and leaves rates blank when required denominators do not exist.
- DONE — Demand Quality now provides a governed B2B conversion baseline from prospecting research through Lead -> Brief -> Opportunity.
- VERIFIED — Existing experiment registry already stores hypothesis, success metric, status, winner and result.
- NEXT — Landing-page conversion review using attributed visits and recorded signup outcomes.
- NEXT — First governed CTA/message experiment only after sufficient baseline traffic exists.
- POLICY — No dark patterns or privacy-policy bypasses.

### F. Attribution and feedback loop
Status: ACTIVE / MARKETPLACE OUTCOME BASELINE IMPLEMENTED
- VERIFIED — Existing first-party attribution tracker persists UTM source/medium/campaign/content/term and records attributable page views.
- DONE — First-party opportunity-share source/channel attribution at the shared-link view layer.
- DONE — Opportunity share URLs use the existing UTM model (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`).
- DONE — Sanitized attribution is mirrored into a same-site first-party cookie so verified server actions can carry source/campaign context beyond the landing page.
- DONE — `registration_completed` is emitted only after the selected account path is persisted; attribution recording failure cannot block registration.
- DONE — `application_submitted` is emitted into the existing `marketing_events` layer only after the application row is successfully created; client attribution cannot declare the outcome itself.
- DONE — `brief_received` is emitted by the current governed Support commercial-intake adapter only after Dana creates a new verified brief chain; duplicate demand intake is excluded.
- DONE — Channel Quality uses the existing `marketing_events` store to compare visits, registrations, applications and verified briefs by source/campaign without adding a second analytics database.
- DONE — Channel evidence is ranked by outcome depth (`verified demand` > `talent conversion` > `registration` > `traffic`) rather than an invented composite score.
- NEXT — Extend comparable brief attribution to any additional verified source adapters.
- NEXT — Use production evidence to determine which source/campaign deserves a controlled experiment or more distribution.
- VERIFIED — Email feedback diagnostics remain part of the existing email engine.
- POLICY — Optimize for channel quality and marketplace outcomes, not traffic volume alone.

## Deferred until prerequisites exist
- Paid ads and ad creative at scale.
- Paywalls and monetization CRO.
- Churn prevention based on paid subscriptions.
- App Store Optimization until mobile store launch readiness.
- SMS lifecycle automation unless justified by user behavior and consent.

## Deployment policy for this program
- Batch related implementation into milestone-sized changes.
- Do not deploy merely to test whether code builds.
- Prefer CI validation before milestone merge.
- Merge to main only when the batch is review-ready and the resulting deployment is worth consuming.

## Completion definition for this program
The Online Marketing Growth Engine is considered operational when MLAMH can measure and improve the full loop:

Acquisition -> Activation -> Conversion -> Retention -> Referral -> Revenue readiness -> Learning

for both Talent and Publisher sides, while preserving privacy, approvals, country context, and governed external actions.
