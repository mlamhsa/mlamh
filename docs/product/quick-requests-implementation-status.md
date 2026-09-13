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
Status: CLOSED / merged to `main` via PR #323 after successful Vercel validation.

Implemented:
- Added `مناسب لك اليوم / Matched for you today` for approved talent.
- Reused the existing `evaluateTalentForBrief` matching engine; no duplicate matching system.
- Shows Quick Requests and Casting opportunities with clear labels.
- Added smart empty state for Quick Requests, Casting, and profile improvement.
- Surfaces unread-message attention only when relevant.
- Moved additional profile/account tools below the core dashboard content.
- Kept non-approved talent states focused on completion/review readiness.
- No talent/account/application/message/conversation records were modified.

## Phase 5 — Matching
Status: CLOSED / merged to `main` via PR #325 after successful Vercel validation.

Implemented:
- Extended the existing Qualification/Supply engine; no duplicate matching engine.
- Added explicit city match states: `local`, `travel`, `none`.
- Exact-city matches remain strongest and are ranked first on the talent dashboard.
- Out-of-city matches require both request flexibility and talent opt-in via `ready_to_travel` or `work_outside_city`.
- Publisher local-only requirements override talent travel willingness.
- Added Quick Request city-flexibility checkbox, persisted in existing `role_requirements.city_flexible` JSONB; no migration.
- Existing opportunities without the flag remain local-only by default.
- Talent dashboard displays `✈️ يتطلب السفر إلى ...` for travel matches.
- Added regression coverage for local, flexible, travel-enabled, and local-only cases.
- No migration/backfill or production data mutation.

## Phase 6 — Interest + Invitations
Status: NEXT

Scope:
- Reuse existing opportunity/application/invitation foundations; do not create open unsolicited DMs.
- Talent can express `مهتم / Interested` on a relevant opportunity with an optional short note.
- Publisher can review interested talent profiles and decide whether to start contact.
- Reuse `opportunity_invitations` for publisher-initiated contact wherever compatible.
- Publisher invitations require talent acceptance before chat can open.
- Talent-initiated interest is the consent signal that allows the publisher to proceed toward contact.
- Do not expose phone/WhatsApp details.
- Do not rebuild chat in this phase; full chat integration remains Phase 8.
- Preserve current application flow and existing invitations.
- No migration/backfill unless existing schema proves insufficient and is separately reviewed.

## Remaining phases
7. Talent Directory Invitations
8. Chat Integration
9. Notifications + Statuses
10. Trust / Anti-abuse
11. Final Desktop + Mobile E2E
