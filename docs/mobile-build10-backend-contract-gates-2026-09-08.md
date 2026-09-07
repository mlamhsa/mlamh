# MLAMH Mobile Build 10 — Backend Contract Gates

Date: 2026-09-08
Branch: `feat/mobile-platform-phase0`
PR: #112

This document separates mobile code readiness from backend deployment readiness. Build 10 must not be treated as release-ready merely because Expo/TypeScript/Bundle CI succeeds.

## Release policy

- Mobile UI/build validation and backend deployment are separate gates.
- Do not deploy backend, run Supabase migrations/DML, merge `main`, or create Build 10 from this document alone.
- Production/TestFlight uses `EXPO_PUBLIC_API_BASE_URL=https://mlamh.net`; therefore any mobile route that depends on branch-only server code must be deployed before that feature can work against production.
- A missing optional API may use an explicit client fallback only when the client was designed for that fallback. Do not silently treat missing required APIs as success.

## Canonical logic that must remain consistent

- **Profile Completion**: 0–100 server-calculated quality/completeness indicator.
- **Review Readiness**: required fields; no percentage threshold.
- **Fast Track Auto Approval**: separate server policy; currently requires 70%+ plus quality signals. Falling short means manual review, not rejection.
- **Setup Journey Progress**: 25/50/75/100 onboarding-step progress; not Profile Completion.
- **Opportunity Apply Gate**: talent must be approved and Review Ready.
- **Legacy approved talents**: approval is preserved; missing current required fields block new applications but must not automatically revoke approval or legacy visibility.

## Backend route inventory versus current `main`

### Required branch-only routes — release blockers until backend deployment

1. `POST /api/account/type`
   - Used by new Google/account-type selection to persist Talent vs Publisher before onboarding.
   - Current `main` has `/api/account/me` but not `/api/account/type`.

2. `POST /api/talent/me/review`
   - Used by native talent Review screen to submit a ready profile for review.
   - Current `main` has `/api/talent/me` and `/api/talent/me/media`, but not `/api/talent/me/review`.

3. `/api/publisher/*` mobile contract
   - `/api/publisher/me`
   - `/api/publisher/onboarding`
   - `/api/publisher/profile`
   - `/api/publisher/verification`
   - `/api/publisher/opportunities`
   - `/api/publisher/opportunities/[id]`
   - Current `main` only exposes the older publisher `dashboard-counts` subtree; the native publisher experience therefore depends on branch server code.

4. `POST /api/support`
   - Used by the native Support form.
   - Route is branch-only.
   - The route calls the database RPCs `consume_support_rate_limit` and `create_support_ticket_with_message`.
   - No definitions for those RPCs are tracked in the current `main` tree. Therefore Support must **not** be classified as code-only until the production database is separately verified to contain both RPCs. No migration or DML is authorized by this document.

5. `/api/mobile/talents` and `/api/mobile/talents/[slug]`
   - Used by the native public Talent Directory and Talent Detail screens.
   - Current `main` mobile API subtree exposes `devices` but not the talent-directory routes.

### Branch-only but client has a deliberate fallback

- `GET /api/mobile/profile-options`
  - Provides canonical cities/nationalities.
  - Current client falls back to bundled Saudi city and nationality options if unavailable.
  - This is not a crash blocker, but backend deployment is still preferred so web/mobile option sources remain canonical.

### Already present on current `main`

- `/api/account/me`
- `/api/applications/mine`
- `/api/conversations` and conversation detail subtree
- `/api/notifications` and notification-read subtree
- `/api/opportunities` and opportunity detail/apply subtree
- `/api/mobile/devices`
- `/api/talent/me`
- `/api/talent/me/media`
- `/api/talent/onboarding`

Presence on `main` does not by itself prove the production deployment is on the same commit. Production deployment must be checked separately before release.

## Minimal backend release package classification

The Build 10 backend package should be split by dependency class instead of deploying every PR #112 change together.

### A. Core code-only candidate package

Subject to a final production-schema compatibility check, these routes/services are code-only candidates because the reviewed implementation uses existing application tables/columns and does not rely on any of the four new PR #112 migrations merely to expose the HTTP contract:

- `/api/account/type`
- `/api/talent/me/review`
- `/api/publisher/me`
- `/api/publisher/onboarding`
- `/api/publisher/profile`
- `/api/publisher/verification`
- `/api/publisher/opportunities`
- `/api/publisher/opportunities/[id]`
- `/api/mobile/talents`
- `/api/mobile/talents/[slug]`
- optional `/api/mobile/profile-options`
- their referenced server libraries under `lib/accounts`, `lib/talents`, `lib/talent`, `lib/publishers`, `lib/mobile` and related existing contracts.

This classification means **candidate for a code-only backend release**, not authorization to deploy it.

### B. Support — separate database prerequisite gate

`/api/support` is not included in the code-only classification yet. The route depends on two RPCs whose definitions were not found in the current `main` repository tree:

- `consume_support_rate_limit`
- `create_support_ticket_with_message`

Before Support is released, verify those functions exist in the production database and have the expected signatures/permissions. If they do not exist, define a separately reviewed database change. Do not infer or execute a migration automatically.

### C. Database/security changes explicitly separated from the minimal backend contract

The four PR #112 migrations are **not prerequisites merely to expose the core HTTP routes above** and must not be bundled into a Build 10 backend deploy by default:

1. `20260903130500_fix_talent_notification_rls.sql`
   - Notification RLS/index hardening.
   - Treat as a separate security rollout.

2. `20260903131000_mobile_push_devices.sql`
   - Creates `mobile_push_devices` and its RLS/indexes.
   - Relevant to push-device registration, not required for core account type/review/publisher/talent-directory contracts.
   - Roll out separately when push registration is intentionally enabled.

3. `20260904001000_harden_talent_public_read_privacy.sql`
   - Revokes direct client reads and hardens talent-table RLS.
   - Important privacy work, but a separate security/cutover decision from the minimal mobile backend contract.

4. `20260904001500_prepare_private_talent_gallery.sql`
   - Private gallery bucket preparation only.
   - Explicitly excluded from Build 10 contract rollout. No private gallery cutover is authorized.

No Supabase migration, DML, RLS change, bucket change or private-gallery cutover is authorized as part of this audit.

## Non-backend Build 10 device gates

- iOS DOB picker: Gregorian only and all visible digits Latin `0–9`; native iOS spinner behavior still requires physical-device validation or replacement with a controlled picker if it ignores `nu-latn`.
- Gallery full-screen first-open Safe Area screenshot on a Dynamic Island device.
- Arabic RTL visual validation across Profile, Applications, Messages, Opportunities, Settings, edit sheets and bottom tabs.
- Arabic tab physical order: right to left `الملف → الرسائل → طلباتي → الفرص`.
- First-run locale persistence and splash/welcome branding.
- Google new-user role-selection E2E.
- Password-login onboarding return-state E2E.
- Talent journey continuity: onboarding → profile data → media → review.
- Publisher onboarding/profile/verification/opportunity lifecycle E2E after required backend routes are deployed.
- Native legal content must be synchronized with the authoritative full legal text before public release.
- Native Support E2E after its RPC prerequisite and `/api/support` deployment are verified.

## Build 10 decision rule

Build 10 may be created only after the intended QA batch is complete and explicitly authorized. A successful Mobile CI or Bundle Diagnostic is necessary but not sufficient. Before release/TestFlight acceptance, required production backend contracts and external auth/linking gates must also be verified.
