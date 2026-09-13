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
- Added three user-facing publisher choices:
  - Individual / Project owner
  - Store / Business
  - Company / Organization
- Preserved the canonical backend split:
  - Fast-track choices continue to use `publisher_type=individual`.
  - Professional organizations continue to use existing organization publisher types.
- Required for fast-track onboarding:
  - Full name
  - Mobile number (required, not marked verified)
  - City
  - Individual role + use case, or business name + business type
  - Optional social/profile link
- Reused existing `publishers.publisher_type_other` to persist the fast-track subtype; no schema migration added.
- Reused existing publisher fields for company/project name, city, phone, description, and social link.
- Fast-track account activation preserves the existing product rule that individual publishers can activate without organization review; opportunity review remains separate.
- Added compatibility guard: established publisher accounts or accounts with existing opportunities are not rewritten by onboarding.
- No talent, application, message, conversation, or opportunity records were modified.

## Phase 2 — Quick Request Creation
Status: CLOSED / merged to `main` via PR #321 after successful Vercel validation.

Implemented:
- Kept existing `posting_mode=quick`; no parallel request system or schema changes.
- Fast-track publishers now enter a WhatsApp-style “What do you need?” flow directly.
- Professional organizations retain the existing Quick Request vs Project / Casting chooser.
- Added an isolated deterministic quick-request parser for talent type, city, gender, date, duration, compensation, budget, and count.
- At most one essential follow-up is asked when talent type cannot be inferred.
- Added structured editable preview before submission.
- Submits through the existing `/api/create-opportunity` endpoint and current `createOpportunityAction`.
- Current opportunity review behavior remains unchanged; no payment is introduced yet.
- Fast-track publishers can still switch to the existing detailed Project / Casting flow.
- Legacy individual publishers without the new fast subtype remain on the existing flow.
- No talent, application, message, conversation, or existing opportunity records were modified.

## Phase 3 — Public Opportunities
Status: NEXT

Scope:
- Keep public opportunity browsing open to visitors.
- Visually distinguish Quick Requests from Project / Casting opportunities.
- Update homepage opportunities section to present both content types clearly.
- Make public opportunity pages acquisition-aware: unauthenticated visitors should be guided to sign up as talent and return to the same opportunity intent.
- Preserve the current opportunity/application foundation and SEO behavior.
- Do not implement Interest/Invitation mechanics yet; those remain Phase 6/7.

## Remaining phases
4. Talent Dashboard
5. Matching
6. Interest + Invitations
7. Talent Directory Invitations
8. Chat Integration
9. Notifications + Statuses
10. Trust / Anti-abuse
11. Final Desktop + Mobile E2E
