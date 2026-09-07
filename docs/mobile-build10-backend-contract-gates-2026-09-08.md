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
   - Production database verification on 2026-09-08 confirmed both required RPCs exist with the signatures expected by the route and are executable by `service_role`:
     - `consume_support_rate_limit(p_key_hash text, p_limit integer, p_window_seconds integer)`
     - `create_support_ticket_with_message(p_user_id uuid, p_profile_id bigint, p_sender_name text, p_sender_email text, p_sender_phone text, p_category text, p_subject text, p_message text, p_locale text, p_source text)`
   - `support_tickets` and `support_messages` are also present in production.
   - Therefore Support no longer has an unresolved database prerequisite for this route. Runtime E2E remains required after the route is deployed.

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

## Production schema compatibility audit — 2026-09-08

A read-only audit was run directly against the production Supabase project. No migration, DML, RLS change, bucket mutation or function invocation was performed.

Verified existing production contracts used by the candidate package:

- `profiles` contains the mobile account/onboarding/review fields used by the branch code, including `account_type`, `display_name`, `phone`, `status`, `onboarding_status`, `onboarding_step`, `approval_status`, `profile_completed_at`, and timestamps.
- `talents` contains the current review-readiness/profile/mobile-directory fields, including `user_id`, `image_url`, `primary_role`, `city_slug`, `gender`, `date_of_birth`, `nationality`/`nationality_slug`, `base_country_code`, profile/detail attributes and publication/status fields.
- `publishers` contains the mobile onboarding/profile/verification fields used by the branch code, including `profile_id`, `publisher_type`, `company_name`, `contact_name`, `city`, social/contact fields, `profile_image_url`, `status`, `verified`, the verification-state fields and `country_code`.
- `opportunities` contains the fields used by native Publisher opportunity creation, including `publisher_id`, `status`, `published`, `posting_mode`, `compensation_type`, `country_code`, `currency`, `managed_by_mlamh`, demographic requirements, dates, `role_requirements`, `required_count` and draft metadata.
- Storage bucket `publisher-assets` exists in production and is public, matching the current publisher-logo upload implementation.
- Support RPCs and support tables are present as described above.

Result: no missing production table/column/bucket/function dependency was found in the reviewed core code-only candidate package. This clears the **schema-compatibility audit gate**, but it is not authorization to deploy and does not replace route-level runtime E2E.

## Route-level runtime dependency audit — 2026-09-08

The branch-only routes were reviewed for runtime dependencies beyond table/column presence.

- `POST /api/account/type` is self-contained around authenticated request identity plus the existing `profiles` table. No external provider call or new database object is required by the route.
- `POST /api/talent/me/review` depends on canonical readiness/completion/Fast Track logic and existing `profiles`/`talents`. Admin event emission is best-effort: event creation is wrapped in `try/catch`, so an event-write failure does not reverse a successful review submission. Runtime E2E is still required.
- Publisher onboarding/profile routes use the authenticated user, `profiles`, `publishers`, and the existing `publisher-assets` bucket. Logo upload uses the server admin client and therefore does not depend on end-user Storage RLS for the write path.
- Publisher opportunity creation uses static market configuration plus existing `profiles`, `publishers`, and `opportunities`; organizations must be approved and verified before creating drafts, while individual publishers do not require organization verification.
- `POST /api/support` requires the two verified production RPCs. The commercial-intake adapter runs after the response and is wrapped in `try/catch`; failure of that secondary processing must not make ticket creation fail.
- `/api/mobile/talents` and `/api/mobile/talents/[slug]` use server-side/admin-backed public-talent retrieval and do not require a new database object merely to answer requests.

### Remaining behavior/performance gates found by the runtime audit

1. **Publisher company-email verification is currently a manual/pending workflow, not an email challenge.**
   - The mobile verification service validates that the submitted address is an organization email, rejects common public-email domains, and writes `verification_status = pending` plus the email.
   - The reviewed path does not send a verification email, issue a token, or confirm mailbox ownership.
   - This is acceptable only if the intended Build 10 behavior is **submit company email for manual review**. If the product copy promises an automatic email-verification link, the implementation/copy must be changed before release.

2. **Advanced public-talent filters still have a scalability issue.**
   - The simple public directory path uses batched server-side candidate retrieval.
   - When gender/nationality/age/height filters are present, `getFilteredPublicTalents()` currently calls `getPublishedTalents()` and then applies those advanced filters in memory.
   - `getPublishedTalents()` collects all visible published talents before filtering, so request cost grows with the full published talent population.
   - This is not a current schema blocker, but it violates the intended DB-side filtering/pagination scalability direction and should be corrected before the directory grows materially or before a public release that advertises those advanced filters at scale.

3. **Runtime E2E cannot be claimed before the branch-only routes are actually available on the production API origin.**
   - Preview build success proves compilation/integration at build time, not production route availability.
   - Do not mark Google role persistence, talent review submission, native Publisher lifecycle, native Support, or native Talent Directory as production-E2E complete until the approved backend code is deployed and tested against `https://mlamh.net`.

## Minimal backend release package classification

The Build 10 backend package should be split by dependency class instead of deploying every PR #112 change together.

### A. Core code-only candidate package — production schema compatibility verified

The following routes/services are code-only candidates against the currently verified production schema and do not rely on any of the four new PR #112 migrations merely to expose the HTTP contract:

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
- `/api/support`
- optional `/api/mobile/profile-options`
- their referenced server libraries under `lib/accounts`, `lib/talents`, `lib/talent`, `lib/publishers`, `lib/mobile` and related existing contracts.

This classification means **candidate for a code-only backend release**, not authorization to deploy it.

### B. Database/security changes explicitly separated from the minimal backend contract

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
- Native Support E2E after `/api/support` deployment.

## Build 10 decision rule

Build 10 may be created only after the intended QA batch is complete and explicitly authorized. A successful Mobile CI or Bundle Diagnostic is necessary but not sufficient. Before release/TestFlight acceptance, required production backend contracts and external auth/linking gates must also be verified.
