# MLAMH Multi-Country Foundation

## Goal
Make the MLAMH core country-aware while Saudi Arabia remains the only operational market.

Vision: **Started in Saudi Arabia. Built for the GCC. Scaling across MENA.**

## Core principles

1. Country existence does not mean market activation.
2. Market status and feature activation are independent controls.
3. Saudi Arabia (`SA`) is the only active operational market today.
4. Prepared markets remain closed unless a specific feature is deliberately enabled.
5. Unknown or unsupported markets must fail closed.
6. Nationality is never used as a proxy for base location or work eligibility.
7. Talent location must distinguish nationality, base market, base city, and work markets.
8. Cross-border matching must not require `talent.base_country === opportunity.country`.
9. Payment activation is independent from currency readiness.
10. SEO indexability is an explicit market feature and must never follow data existence automatically.

## Initial market states

| Country | Status | Operational features |
| --- | --- | --- |
| SA | active | enabled according to current Saudi experience |
| AE | prepared | disabled |
| EG | prepared | disabled |
| MA | prepared | disabled |
| QA | prepared | disabled |
| JO | future | disabled |
| LB | future | disabled |
| KW | future | disabled |

The roadmap is strategy, not business-logic hardcoding.

## Market feature controls

Each market can independently control:

- Talent registration
- Publisher registration
- Opportunity creation
- Applications
- Public talent directory
- Public opportunities
- Search/discovery
- Payments
- SEO indexing

Example future state: Egypt may allow talent registration while publisher registration, local opportunities, payments, and SEO indexing remain disabled.

## Location model

### Talent

- `nationality`
- `base_country_code`
- base city using the existing city representation initially
- work markets through a dedicated relation
- travel availability
- languages

### Publisher

- `country_code`
- city

### Opportunity

- `country_code`
- city
- currency when commercially relevant

### Casting / commercial brief

- `country_code`
- city
- currency or budget context where applicable

## Matching order

Qualification remains a quality gate and is separate from brief eligibility or ranking.

Recommended eligibility order:

1. Talent qualification
2. Opportunity market eligibility / work market
3. Base location and travel availability
4. Role
5. Hard brief requirements
6. Availability
7. Skills/languages/experience
8. Ranking

Do not reduce cross-border matching to same-country or same-city equality.

## Backward compatibility

- Existing Saudi URLs remain unchanged.
- Existing talent, publisher, opportunity, application, and conversation records remain usable.
- Existing Saudi payment UX remains unchanged.
- Existing Saudi SEO pages remain indexed.
- Country-aware schema changes must be additive first.
- Legacy null country fields must be tolerated during transition.
- Production backfill requires explicit approval and must never guess when classification is uncertain.

## SEO guardrail

Market data does not imply public indexing. Sitemap, public market pages, and generated SEO surfaces must consult the explicit `seoIndexing` market feature.

Prepared and future markets must not create thin or empty public country pages.

## Migration contract

The first production schema migration is additive only. It creates the market registry, country columns, and talent work-market relation without backfilling legacy rows or activating a non-Saudi market.

- `market_countries` is the future database source of truth for market status and capabilities.
- `talent_work_markets` uses row existence as the enabled state; no separate `enabled` flag is required.
- New country columns remain nullable during the compatibility window.
- `market_countries` and `talent_work_markets` are service-role only initially and have RLS enabled.
- New tables use explicit grants rather than relying on Supabase default Data API exposure.
- Existing `public.set_updated_at()` is reused for new-table timestamp triggers.
- No legacy row is classified or changed by the schema migration itself.

## Deployment ordering contract

The safe production sequence is intentionally split into gates:

### Gate 1 — Code readiness

Before any schema change:

1. Feature branch is green on the complete test suite and production build.
2. Public Saudi behavior remains backward-compatible.
3. Prepared/future markets remain closed in public search and SEO.
4. Admin market readiness remains read-only.
5. Migration file is reviewed against the current production schema and migration ledger.

### Gate 2 — Schema migration

Only after explicit production-migration approval:

1. Re-check the latest production migration ledger immediately before execution.
2. Apply only the new additive multi-country migration; never replay old repository migrations.
3. Verify the new tables, columns, foreign keys, indexes, RLS state, grants, and triggers with read-only SQL.
4. Verify no legacy rows were backfilled and no non-Saudi market became active.
5. Stop if any verification differs from the reviewed contract.

### Gate 3 — Runtime schema adoption

Only after Gate 2 verification:

1. Update server queries to read real country columns and `talent_work_markets`.
2. Keep compatibility fallback for legacy null country fields during transition.
3. Add database-level country filters to public queries only after the columns exist in production.
4. Re-run Tests + Build before deployment.
5. Deploy the first integrated country-aware runtime milestone.

### Gate 4 — Controlled data backfill

Backfill is a separate production DML decision and is not part of the schema migration.

1. Backfill only rows that can be classified as Saudi with high confidence.
2. Do not infer location from nationality.
3. Keep uncertain rows null for manual or later resolution.
4. Verify counts before and after the backfill.

### Gate 5 — Market feature activation

A market is never activated merely because its country exists in the database.

Any future feature activation requires an explicit decision for the specific market and feature. Payments and SEO remain independently gated. UAE, Egypt, Morocco, Qatar, Jordan, Lebanon, and Kuwait remain closed until deliberately activated.

## Deployment policy

Development uses branch commits plus Tests and Build. Deployments are grouped at meaningful milestones only. No production deployment, production DML, schema migration, payment activation, or country activation without explicit approval.
