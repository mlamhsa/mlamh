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

## Deployment policy

Development uses branch commits plus Tests and Build. Deployments are grouped at meaningful milestones only. No production deployment, production DML, schema migration, payment activation, or country activation without explicit approval.
