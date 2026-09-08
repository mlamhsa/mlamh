# MLAMH Mobile — Build 11 QA / Implementation Tracker

Last updated: 2026-09-08

This file is the source-of-truth tracker for the Build 11 batch. A source change is not a physical-device PASS until verified on Build 11.

## Status legend
- ✅ Source implemented / verified as stated
- 🟡 Source implemented, device or integration verification still required
- ⏳ Not yet completed
- 🔒 Release/configuration gate — requires controlled rollout or owner intervention

## Registration & authentication
- ✅ Intent-first signup: Acting / Modeling / Find talent on mobile and web.
- ✅ Email + password remains the credential model; OTP is only new-email verification.
- ✅ Mobile and web 6-digit Email OTP UI/verification/resend flows exist in source.
- ✅ Verified email flow creates/updates canonical account data before onboarding.
- ✅ Required mobile number is collected for email registration and social registration completion.
- ✅ Google and Apple signup converge through shared callback/account-completion logic.
- ✅ Email signup with an immediate Supabase session persists canonical account details and Actor/Model intent directly instead of duplicating the path chooser.
- ✅ Pending social signup context has a 30-minute TTL and carries intent/locale/terms acceptance.
- ✅ Cancelled/failed OAuth clears stale pending signup state and returns to signup/login instead of leaving a stuck callback.
- ✅ Normal password/Google/Apple login clears stale signup context before authentication.
- ✅ Signup/Login/OTP/Complete Account critical back actions use safe fallback navigation instead of depending only on router history.
- 🟡 Google callback and all new auth convergence behavior require Build 11 physical-device verification.
- 🟡 Apple OAuth source path exists and iOS config declares `usesAppleSignIn: true`; Apple Developer + Supabase provider configuration and real-iPhone verification remain.
- 🔒 Production Supabase Confirm Signup template must not switch to OTP until the controlled release/configuration gate is approved.
- 🔒 Existing registered accounts remain untouched/backward-compatible.

## Account data
- ✅ `profiles.phone` is the canonical application phone field.
- ✅ Account context exposes phone, phone verification state and onboarding step.
- ✅ Account details API creates/updates profile data after auth/social signup.
- ✅ Phone remains unverified until future SMS OTP (`phone_verified_at` null).
- 🟡 Support and Settings read canonical account phone; Build 11 verification required.
- ✅ Admin navigation includes Registration & Activation.
- 🟡 Admin Activation shows canonical phone, account type, onboarding status/step, approval state and recent update; Preview verification required.
- 🟡 Admin Activation privacy lookup fails safely when Production intentionally lacks the Build 11 privacy schema.
- ⏳ Surface phone SMS verification in Admin only after the verification contract is actually live; never infer verification from phone presence.

## Account deletion / App Store compliance
- ✅ In-app Settings entry for permanent account deletion.
- ✅ Destructive confirmation states account/profile/photos/associated data are permanently removed.
- ✅ Authenticated `/api/account/delete` source endpoint and deletion service exist.
- ✅ Service removes owned gallery storage, talent/profile/privacy rows, publisher opportunity/profile data, roles/marketing user data, then Supabase Auth user.
- 🟡 Full deletion path requires isolated test-account verification; do not test with a real account.
- 🔒 Sign in with Apple deletion must revoke Apple authorization before App Store release once Apple provider configuration is complete.
- 🔒 Production backend route exposure remains gated; source implementation alone is not App Review-ready.

## Talent onboarding journey
- ✅ New intent-first registration avoids asking Actor/Model twice when known.
- ✅ Journey orchestrator routes to the next real incomplete step: core data → female privacy reassurance when needed → photos → review.
- ✅ Formal Journey Progress remains 25 / 50 / 75 / 100 and is separate from Profile Completion and Review Readiness.
- ✅ Social account completion describes registration itself as Step 2 of 2; it no longer invents a conflicting 5-step total.
- ✅ Legacy Actor/Model fallback chooser is redesigned into compact mobile-native cards, explicit current selection and a clear CTA; image-dominant long cards removed.
- ✅ Legacy path chooser back action uses a safe fallback.
- 🟡 Profile editor uses explicit Save & Continue, validates review-required fields and warns before unsaved exit; Build 11 verification required.
- 🟡 Mid-onboarding relaunch canonical route fix requires Build 11 physical-device verification.
- ✅ Web carries Actor/Model intent into talent setup and no longer marks onboarding completed immediately after role selection.
- 🟡 Screen/copy/CTA regression remains part of Build 11 Device QA rather than being considered a device PASS from source alone.

## Talent privacy
- ✅ Product modes: `public`, `verified_publishers`, `private`.
- ✅ Female onboarding reassurance appears before photo upload; recommended option is verified publishers only.
- ✅ Restricted visibility does not make a talent incomplete or unqualified for matching/readiness.
- ✅ Authenticated privacy GET/PATCH API + privacy history exist.
- ✅ Public projection strips non-public photos.
- ✅ `verified_publishers` checks actual Publisher verification state (`publishers.verified` / `verification_status`) in addition to approved/active account state; approved-but-unverified publishers do not receive restricted access.
- ✅ Viewer-aware talent profile lookup allows a genuinely verified publisher to open a `verified_publishers` profile while anonymous/unverified viewers cannot.
- ✅ Private profiles remain owner/admin-only in profile browsing.
- ✅ Privacy tests cover verified vs unverified publishers, guests, private profiles and restricted photos.
- ✅ Public directory and sitemap continue to use public-only talent candidates.
- ✅ Talent page metadata uses viewer-aware lookup, so anonymous crawlers do not receive metadata for restricted/private profiles.
- ✅ Matching/supply qualification intentionally does not fail solely due to privacy mode; privacy remains an exposure/access concern rather than readiness.
- ✅ Exact Build 11 privacy schema is present on Staging only.
- 🔒 Production privacy migration is NOT applied.
- 🔒 Private gallery/storage delivery is NOT cut over; do not claim private URLs are secure until signed/private delivery is implemented and verified.
- ⏳ Dedicated Admin privacy filters/history detail beyond Activation overview can follow after the core release.
- 🟡 Controlled shortlist/share presentation still requires integration regression before exposing restricted media in any new surface.

## Build 10 physical-device QA carried into Build 11
- 🟡 Opportunities Arabic filter and featured horizontal containers anchor from the right in source.
- 🟡 Opportunity details/list, Publisher brief date picker and DOB source formatters use Gregorian calendar + Latin numbering; verify all visible date/number surfaces on Build 11.
- 🟡 Gallery logical first image begins from the right in Arabic and cards are compact.
- 🟡 Long-press horizontal drag reorder is RTL-aware with scale/vibration feedback and auto-save on drop; textual reorder buttons removed.
- 🟡 Primary-photo feedback updates immediately with badge/state/non-blocking confirmation.
- ✅ Gallery fullscreen safe-area was Build 10 physical-device PASS; regression-check Build 11.
- ✅ Nationality canonical/fallback datasets are substantially expanded.
- 🟡 Nationality selector has search, current selection, draft selection, explicit confirmation, RTL and empty state.
- 🟡 Measurements & Appearance redesigned into compact metrics/selectors.
- 🟡 Gold required-star UX is implemented in registration, profile, support, publisher setup and the required Publisher opportunity brief fields.
- 🟡 Publisher opportunity numeric inputs normalize Arabic/Persian digits to Latin digits before saving.
- 🟡 Settings language switching updates in place without route replacement/relaunch.
- 🟡 Password recovery prefills signed-in email and uses context-aware return.
- 🟡 Support email/mobile fields align correctly in Arabic while values preserve readable LTR direction.
- 🟡 Legal document switching resets scroll to top.
- 🟡 Back-navigation hardening covers Login, Signup, Email OTP, Complete Account, Publisher Setup, Publisher Create Opportunity and legacy Talent chooser; Build 11 device verification required.
- 🟡 Bottom-nav source ordering renders Profile at far right for Arabic; Build 11 device verification required.

## Publisher onboarding
- 🟡 Publisher setup uses a guided identity step, required fields, Save & Continue, inline validation, unsaved-change guard and safe back fallback.
- ✅ Existing opportunity creation backend rules were audited before changing product assumptions: title/description/type are hard validated; market/verification gates remain server-enforced.
- ✅ Create Opportunity marks the backend-required title/category/description fields with gold required indicators and validates title/description locally before API submission.
- 🟡 Current Create Opportunity experience is the supported structured brief path and must be regression-tested before a deeper onboarding redesign.
- ⏳ A larger brief-led publisher onboarding redesign can be a post-Build-11 product iteration; do not invent unsupported AI generation in this release batch.
- 🟡 Admin Activation exposes Publisher canonical phone/onboarding state consistently with Talent.

## Web / route cleanup
- ✅ `/join` is intent-first with Acting / Modeling / Find talent.
- ✅ No continuous registration-field autosave in the web quick form.
- ✅ Email signup routes to 6-digit OTP rather than the legacy confirmation-link message.
- ✅ Web OTP creates canonical account data before onward routing.
- ✅ Google + Apple web signup share callback + required-phone completion and receive selected intent.
- ✅ OAuth callback no longer falls back to legacy `/join/account-type` for unresolved new users.
- ✅ The stale server signup action is no longer present in the current `/join/page.tsx` source.
- 🟡 Legacy `/join/account-type` remains backward-compatible recovery only for authenticated old accounts without a saved type; retire after regression verification.
- 🟡 Canonical join rewrite requires Preview/regression verification before release readiness.

## Security / release gates
- 🔒 PR #112 remains Draft and unmerged.
- 🔒 No public App Store / Google Play release.
- 🔒 No Production Auth OTP template switch yet.
- 🔒 Staging privacy DDL only; Production schema remains unchanged.
- 🔒 Do not enable RLS blindly on `marketing_events`, `roles`, `permissions`, `role_permissions`, `user_roles`; policies must be designed and validated first.
- ⏳ Security policy cleanup for those five advisory tables is intentionally separate from Build 11 because an incorrect RLS change could break runtime access.

## Build 11 release-prep state
- ✅ `apps/mobile/app.json` is prepared with iOS `buildNumber: 11` and Android `versionCode: 11`.
- ✅ Source implementation batch is frozen as a Build 11 candidate pending exact-head Preview success and controlled Production/configuration gates.
- 🔒 TestFlight/preview builds point to Production Supabase/API, so Build 11 cannot correctly exercise the new signup/privacy/deletion contracts until the required selective backend/schema/configuration changes are approved and released.
- 🔒 Required controlled gates before meaningful Build 11 device QA: expose selected new backend contracts, apply the reviewed Production privacy schema, switch the Production signup email template to OTP, configure Apple provider/Apple Developer when ready.
- 🟡 Account deletion then requires an isolated disposable test account.
- No physical-device QA item is closed merely because source/Preview passes.
