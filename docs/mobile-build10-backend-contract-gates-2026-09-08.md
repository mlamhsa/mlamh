# MLAMH Mobile Build 10 — Backend Contract & Release Gates

Date: 2026-09-08
Branch: `feat/mobile-platform-phase0`
PR: #112

This document separates completed source engineering from backend deployment, external-linking, and physical-device validation. Build 10 must not be treated as release-ready merely because Expo/TypeScript/Bundle CI succeeds.

## Release policy

- Mobile source validation and backend deployment are separate gates.
- Do not deploy backend, run Supabase migrations/DML, change RLS/buckets, merge `main`, or create Build 10 from this document alone.
- Production/TestFlight uses `EXPO_PUBLIC_API_BASE_URL=https://mlamh.net`; branch-only server routes must be deployed before dependent TestFlight flows can pass production E2E.
- A successful Preview or Mobile CI proves build/source integration, not production API availability or physical-device behavior.

## Canonical talent logic

- **Profile Completion**: 0–100 server-calculated quality/completeness indicator.
- **Review Readiness**: required fields; no percentage threshold.
- **Fast Track Auto Approval**: separate server policy; currently 70%+ plus required quality signals. Falling short means manual review, not rejection.
- **Setup Journey Progress**: 25/50/75/100 onboarding-step progress; not Profile Completion.
- **Opportunity Apply Gate**: talent must be approved and Review Ready.
- **Legacy approved talents**: approval and legacy visibility are preserved; missing current required fields block new applications but do not automatically revoke approval.

## Branch-only backend contracts required by the mobile release

The following source routes are not all available on the current production/main deployment and therefore remain backend deployment gates:

- `POST /api/account/type`
- `POST /api/talent/me/review`
- `/api/publisher/me`
- `/api/publisher/onboarding`
- `/api/publisher/profile`
- `/api/publisher/verification`
- `/api/publisher/opportunities`
- `/api/publisher/opportunities/[id]`
- `POST /api/support`
- `/api/mobile/talents`
- `/api/mobile/talents/[slug]`
- optional `/api/mobile/profile-options`

Already-existing contracts used by mobile include `/api/account/me`, `/api/applications/mine`, conversations, notifications, core opportunities/apply, `/api/mobile/devices`, `/api/talent/me`, `/api/talent/me/media`, `/api/talent/onboarding`, and `/api/casting/request`.

Presence in `main` is not itself proof that the production Vercel deployment contains the same source revision.

## Production schema compatibility audit — complete

A read-only audit was performed against production Supabase. No migration, DML, RLS change, bucket mutation, or support-function invocation was performed.

Verified production dependencies:

- `profiles` contains account type, onboarding, approval, status, completion and timestamp fields used by mobile.
- `talents` contains Review Readiness, mobile profile/directory, publication, role, country, demographic and portfolio fields used by the candidate package.
- `publishers` contains onboarding/profile/verification/country/contact fields used by native Publisher flows.
- `opportunities` contains draft creation, publisher, market/currency, dates, demographic and role-requirement fields used by native Publisher opportunity creation.
- Storage bucket `publisher-assets` exists and matches the current server-side Publisher logo upload implementation.
- Support tables `support_tickets` and `support_messages` exist.
- Support RPCs exist with the signatures expected by `/api/support` and are executable by `service_role` while not exposed directly to `authenticated` users:
  - `consume_support_rate_limit(p_key_hash text, p_limit integer, p_window_seconds integer)`
  - `create_support_ticket_with_message(p_user_id uuid, p_profile_id bigint, p_sender_name text, p_sender_email text, p_sender_phone text, p_category text, p_subject text, p_message text, p_locale text, p_source text)`
- `public.mobile_push_devices` also exists in production; no migration was applied during this audit.

Result: no missing production table/column/bucket/function dependency was found for the reviewed code-only backend candidate package.

## Route-level runtime/source audit — complete with deployment E2E remaining

- `POST /api/account/type` uses authenticated identity plus existing `profiles`; no new database object or external provider call is required.
- `POST /api/talent/me/review` uses canonical readiness/completion/Fast Track logic and existing `profiles`/`talents`; admin-event emission is best-effort and does not reverse a successful submission.
- Publisher onboarding/profile routes use `profiles`, `publishers`, and `publisher-assets`; logo upload is server/admin-backed.
- Publisher opportunity creation uses static market configuration plus existing `profiles`, `publishers`, and `opportunities`. Organizations must be approved and verified; individual publishers do not require organization verification.
- Publisher company-email verification is intentionally a **manual review submission**: it validates an organization-domain email and sets verification to `pending`. Current native copy says the MLAMH team will review it, so the UI and server behavior are aligned. It is not presented as an automated mailbox challenge.
- `POST /api/support` creates the ticket through verified RPCs; commercial intake runs afterward and is wrapped so secondary-processing failure does not invalidate ticket creation.
- `/api/mobile/talents` and `/api/mobile/talents/[slug]` use server/admin-backed public-talent retrieval.
- `/api/casting/request` already exists in the web backend contract. The mobile Casting screen now submits the same brief contract natively instead of handing the user to a browser.

### Advanced Talent Directory performance gate — closed in source

The previous advanced-filter path loaded the full published talent population and filtered it in memory. That source issue has been removed:

- gender, height and date-of-birth age bounds are pushed into the batched database query;
- canonical nationality values are pushed into the database query where resolvable;
- canonical/legacy normalization is retained as a post-filter safety check;
- pagination and the public/legacy visibility policy remain intact;
- the full-table `getPublishedTalents()` fallback is no longer used by the advanced mobile directory path.

The corrected branch passed Mobile CI and a full Vercel Preview build. A basic Preview GET for `/api/mobile/talents` returned HTTP 200. A multi-parameter advanced-filter GET could not be treated as runtime proof through the protected Preview fetch path because Vercel authentication intercepted the tool request; therefore production E2E remains required after approved backend deployment.

## Native-only product/source gates closed in this batch

### Legal and support navigation

- Privacy, Terms, Refund, Support and Complaints deep links now route to native app screens instead of sending legal links to Support or a browser.
- Canonical `/refund`, localized `/ar/refund` and `/en/refund` paths are included alongside the legacy `/refund-policy` alias in the iOS universal-link source configuration.
- Native Legal now contains the authoritative full Privacy, Terms and Refund policy text currently published by the web project, including the July 2026 revision text where the authoritative page declares it.
- Native Support remains dependent on production deployment of `/api/support` for final E2E.

### Native Casting

- The mobile Casting experience no longer opens the web Casting page.
- It collects the brief inside the app and posts the existing `/api/casting/request` contract.
- Required fields, email/contact fallback, talent type, count bounds and Gregorian `YYYY-MM-DD` input are validated before submission.
- Arabic-Indic and Eastern Arabic numeric input is normalized to Latin `0–9` before numeric/date submission.
- A successful request stays in-app and shows the returned request reference.
- No write-based runtime test was executed against production because creating a casting request would be production DML.

### Browser handoff policy

A fresh PR source audit should leave Google OAuth as the only intentional `Linking.openURL` handoff. Core product pages added in this mobile release are intended to stay native.

## Minimal backend release package classification

### Core code-only candidate — production schema compatibility verified

Subject to explicit deployment approval, the mobile contract package consists of the branch-only routes listed above plus their referenced server libraries under `lib/accounts`, `lib/talents`, `lib/talent`, `lib/publishers`, `lib/mobile` and related existing contracts. This classification is **not** authorization to deploy.

### Database/security changes kept separate

The PR migrations remain separate rollout decisions and must not be automatically bundled with the mobile HTTP contract:

1. `20260903130500_fix_talent_notification_rls.sql` — notification RLS/index hardening.
2. `20260903131000_mobile_push_devices.sql` — push-device table/RLS/index rollout. The table is already present in production according to the read-only audit; do not reapply this migration blindly.
3. `20260904001000_harden_talent_public_read_privacy.sql` — direct-read/privacy hardening; separate security cutover.
4. `20260904001500_prepare_private_talent_gallery.sql` — private gallery preparation; explicitly excluded from this release contract and no private-gallery cutover is authorized.

## External/linking release gates — not source-completable without deployment/configuration

- Production `https://mlamh.net/.well-known/apple-app-site-association` currently returns HTTP 404. Branch source exists but requires the backend route to be deployed and `MLAMH_APPLE_TEAM_ID` to contain the verified 10-character Apple Team ID.
- Production `https://mlamh.net/.well-known/assetlinks.json` currently returns HTTP 404. Branch source exists but requires the backend route to be deployed and `MLAMH_ANDROID_SHA256_CERT_FINGERPRINTS` to contain the real release signing certificate SHA-256 fingerprint(s).
- Supabase Auth redirect configuration must permit the native OAuth callback used by the app (`mlamh://auth/callback`) and relevant recovery/onboarding paths as required by the final auth flow.
- Google new-user role selection and account creation require device E2E after the production API contract is available.
- Email confirmation/recovery provider/domain behavior must be verified in the release environment.

## Physical-device Build 10 QA gates

These cannot be truthfully closed from source/CI alone:

- iOS DOB picker: stored/summary date is Gregorian and the app requests Latin numbering, but the native iOS spinner may ignore the numbering extension. Verify all visible DOB digits are Latin `0–9`; replace the native picker with a controlled picker if Build 10 still shows Arabic-Indic digits.
- Gallery full-screen first-open Safe Area screenshot on a Dynamic Island device.
- Arabic RTL visual pass across Profile, Applications, Messages, Opportunities, Settings, edit sheets, Legal, Casting and bottom tabs.
- Arabic bottom-tab physical order: `الملف → الرسائل → طلباتي → الفرص` from right to left.
- First-run locale persistence and splash/welcome branding.
- Google new-user role-selection E2E and restart continuity.
- Password-login onboarding return-state E2E.
- Talent journey continuity: onboarding → profile data → media → review.
- Publisher onboarding/profile/verification/opportunity lifecycle E2E after backend contract deployment.
- Native Support E2E after `/api/support` deployment.
- Push registration/notification routing on a real device.
- Final installed app icon/branding review.

## Build 10 decision rule

Build 10 may be created only after the intended source batch is green and the user explicitly authorizes it. Mobile CI, Bundle Diagnostic and Vercel Preview are necessary source gates but are not substitutes for production backend deployment/configuration or physical-device validation.

At the end of this source batch, any remaining blocker should be one of three kinds only: **explicit backend deployment approval, external provider/link configuration, or physical-device Build 10 QA**.
