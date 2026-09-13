# MLAMH Quick Requests — Implementation Status

Last updated: 2026-09-13

## Guardrails
- Do not modify existing talent records or registered account data.
- Do not run migrations/backfills on Production without separate review and approval.
- Do not refactor approved foundations unless strictly required.
- Preserve current IDs, approval states, conversations, opportunities, applications, and production data.
- Work phase-by-phase; close and verify each phase before starting the next.

## Phase 1 — Publisher Onboarding
Status: CLOSED / merged to `main` via PR #319 after successful Vercel validation.

Implemented:
- Added three user-facing publisher choices: Individual / Project owner, Store / Business, Company / Organization.
- Preserved the canonical backend split: fast-track uses `publisher_type=individual`; professional organizations keep existing publisher types.
- Fast-track requires full name, mobile number, city, role/use case or business identity, with optional social/profile link.
- Reused existing `publishers.publisher_type_other`; no schema migration.
- Added compatibility guard so established accounts / accounts with opportunities are not rewritten.
- No talent, application, message, conversation, or opportunity records were modified.

## Phase 2 — Quick Request Creation
Status: CLOSED / merged to `main` via PR #321 after successful Vercel validation.

Implemented:
- Kept existing `posting_mode=quick`; no parallel request system.
- Fast-track publishers enter the WhatsApp-style “What do you need?” flow directly.
- Professional organizations retain Quick Request vs Project / Casting.
- Added isolated deterministic parser and structured editable preview.
- Uses the existing `/api/create-opportunity` and current review flow.
- No payment, migration, backfill, or mutation of existing production data.

## Phase 3 — Public Opportunities
Status: CLOSED / merged to `main` via PR #322 after successful Vercel validation.

Implemented:
- Public browsing remains open.
- Homepage desktop/mobile now distinguishes `⚡ طلب الآن` from Casting.
- Added additive public routes:
  - `/{locale}/opportunities/quick`
  - `/{locale}/opportunities/casting`
- Added two-option opportunity navigation: `طلبات الآن` and `فرص الكاستينغ`.
- Legacy/null `posting_mode` opportunities remain visible under Casting for backward compatibility.
- Added visitor-to-talent acquisition CTA while preserving the current auth/application foundation.
- Read-only Production check confirmed no slug conflict for `quick` or `casting`.
- No opportunity, talent, account, application, message, or conversation records were modified.
- Automatic return-to-the-same-opportunity after auth remains deferred to avoid changing the approved auth/callback foundation prematurely.

## Phase 4 — Talent Dashboard
Status: NEXT

Scope:
- For approved talent, make `مناسب لك اليوم` the primary dashboard section.
- Keep other approval states focused on completion/review readiness.
- Show attention items only when relevant (new messages / invitations later when Phase 6 exists).
- Keep compact metrics for profile strength, applications, and messages.
- Move profile-development tools lower in the dashboard.
- Preserve current talent records and approval/application behavior.
- Do not implement Matching changes yet; Phase 4 may only consume the safest existing relevance signals available today.
- Do not implement Interest/Invitation mechanics yet.

## Remaining phases
5. Matching
6. Interest + Invitations
7. Talent Directory Invitations
8. Chat Integration
9. Notifications + Statuses
10. Trust / Anti-abuse
11. Final Desktop + Mobile E2E
