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
Status: NEXT

Scope:
- Keep existing `posting_mode=quick`; do not create a parallel request system.
- Fast-track publishers go directly to a simple “What do you need?” flow.
- Professional organizations may still choose Quick Request or Project / Casting.
- Convert plain-language request text into structured existing opportunity fields.
- Ask at most one essential follow-up question when required.
- Show a structured preview before submission.
- Keep current opportunity review behavior until payments are activated later.

## Remaining phases
3. Public Opportunities
4. Talent Dashboard
5. Matching
6. Interest + Invitations
7. Talent Directory Invitations
8. Chat Integration
9. Notifications + Statuses
10. Trust / Anti-abuse
11. Final Desktop + Mobile E2E
