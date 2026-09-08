# MLAMH Mobile — Build 11 QA / Implementation Tracker

Last updated: 2026-09-08

This file is the source-of-truth tracker for the Build 11 batch. A source change is not a physical-device PASS until it is verified on Build 11.

## Status legend
- ✅ Source implemented / verified as stated
- 🟡 Source implemented, device or integration verification still required
- ⏳ Not yet completed
- 🔒 Release/configuration gate — requires controlled rollout or owner intervention

## Registration & authentication
- ✅ Intent-first signup: Acting / Modeling / Find talent.
- ✅ Email + password remains the credential model.
- ✅ Mobile 6-digit Email OTP UI and verification flow.
- ✅ Web 6-digit Email OTP screen added; canonical join handoff still being reconciled.
- ✅ Required mobile number captured for email signup.
- ✅ Social signup completion screen requires mobile number for Google/Apple users.
- ✅ Google and Apple mobile signup entries converge through the same callback/account completion path.
- ✅ Pending social signup context has a 30-minute TTL and carries intent/locale/terms acceptance.
- ✅ No continuous field autosave in the web quick registration form; save occurs on explicit submission.
- 🟡 Google callback source fix needs Build 11 physical-device verification.
- 🟡 Apple OAuth source path exists; iOS app config now declares `usesAppleSignIn: true`. Apple Developer + Supabase provider configuration and real-iPhone verification remain.
- 🔒 Production Supabase Confirm Signup template must not switch to OTP until mobile + web canonical flows are ready.
- 🔒 Existing registered accounts must remain untouched/backward-compatible.

## Account data
- ✅ `profiles.phone` is the canonical application phone field.
- ✅ Account context exposes phone, phone verification state and onboarding step.
- ✅ Account details API creates/updates the profile after auth and social signup.
- ✅ Phone remains unverified until future SMS OTP (`phone_verified_at` null).
- 🟡 Support now reads the canonical account phone for prefill; Build 11 verification required.
- 🟡 Settings now reads the canonical account phone instead of Supabase Auth phone; Build 11 verification required.
- ⏳ Admin phone and verification-state surface audit remains.

## Account deletion / App Store compliance
- ✅ In-app Settings entry for permanent account deletion added and intentionally easy to find.
- ✅ Destructive confirmation clearly states that account/profile/photos/associated data are permanently removed.
- ✅ Authenticated `/api/account/delete` source endpoint added.
- ✅ Server deletion service removes owned talent gallery storage, talent/profile/privacy rows, publisher opportunities/profile data, user roles/marketing user data, then deletes the Supabase Auth user.
- 🟡 Full deletion path requires isolated test-account verification before Build 11/App Review; do not test with a real user account.
- 🔒 Sign in with Apple deletion must also revoke the Apple authorization token before App Store release once Apple provider configuration is complete.
- 🔒 Production backend route exposure/release remains gated; source implementation alone is not App Review-ready until backend + Build 11 verification pass.

## Talent onboarding journey
- ✅ Intent avoids asking Actor/Model twice where known.
- ✅ Journey orchestrator routes to the next real incomplete step.
- ✅ Core data → privacy when applicable → photos → review.
- ✅ Formal Journey Progress remains 25 / 50 / 75 / 100 and stays distinct from Profile Completion/Review Readiness.
- 🟡 Mid-onboarding relaunch canonical route fix needs Build 11 physical-device verification.
- ⏳ Final screen-by-screen copy/CTA consistency and unsaved-change guard audit.

## Talent privacy
- ✅ Product modes defined: `public`, `verified_publishers`, `private`.
- ✅ Female onboarding reassurance is placed before photo upload.
- ✅ Recommended female onboarding option: verified publishers only.
- ✅ Privacy does not reduce talent qualification/readiness solely because visibility is restricted.
- ✅ Authenticated privacy GET/PATCH API and privacy history implemented.
- ✅ Public profile access policy understands profile/photo visibility.
- ✅ Public projection strips photos when photo visibility is not public.
- ✅ Privacy policy tests added.
- ✅ Staging-only schema migration applied to MLAMH Staging (`aempbsenymvxwbxkxdxf`).
- 🔒 Production privacy migration is NOT applied.
- 🔒 Private gallery/storage delivery is NOT cut over yet; do not claim private URLs are secure until signed/private delivery is implemented and verified.
- ⏳ Admin privacy filters/status/history UI.
- ⏳ SEO/sitemap/OG/social creative audit for non-public profiles.
- ⏳ Matching/shortlist controlled-sharing audit.

## Build 10 physical-device QA carried into Build 11
- 🟡 Opportunities Arabic filter/featured horizontal containers now anchor a full-width RTL row from the right in source; Build 11 device verification required.
- 🟡 Opportunity details and DOB source formatters explicitly use Gregorian calendar + Latin numbering; remaining opportunity/list/date surfaces still require audit and Build 11 verification before closing this item.
- ⏳ Gallery RTL ordering starts from right.
- ⏳ Gallery cards/images reduced to professional mobile sizing.
- ⏳ Gallery native drag-and-drop; remove `تقديم` / `تأخير`.
- ⏳ Clear primary-photo feedback.
- ✅ Gallery fullscreen safe-area: Build 10 physical-device PASS.
- 🟡 Canonical nationality dataset expanded substantially across GCC, Arab, European, Asian, African, North/South American and Oceania markets.
- ✅ Mobile nationality fallback is now also comprehensive, so a profile-options API outage no longer collapses the selector back to the old limited list.
- 🟡 Reusable mobile-native single-select sheet source component prepared with search, explicit current selection, draft selection, confirm action, RTL and empty state; profile editor integration remains.
- ⏳ Nationality selector integration in profile editor and Build 11 verification.
- ⏳ Measurements & Appearance redesign.
- 🟡 Settings language switching now updates in place without route replacement/relaunch; Build 11 verification required.
- 🟡 Password recovery now prefills the signed-in account email and uses a context-aware return action; Build 11 verification required.
- 🟡 Support email/mobile labels and values now align correctly for Arabic while preserving LTR value direction; Build 11 verification required.
- 🟡 Legal document switching now resets scroll position to the top; Build 11 verification required.
- ⏳ Back navigation reliability.
- ⏳ Required-field gold-star consistency across all forms. Support form is implemented; remaining forms pending.
- 🟡 Bottom navigation source audit confirms the physical order is Opportunities → Applications → Messages → Profile, which renders Profile at the far right for Arabic; Build 11 device verification remains required.

## Publisher onboarding
- ⏳ Redesign as a brief/value-led guided journey.
- ⏳ Apply required-field and step-save conventions.
- ⏳ Ensure account phone/source-of-truth and Admin state are consistent.

## Web / route cleanup
- ✅ Web quick form no longer continuously writes registration fields to session storage.
- ✅ Web OTP verification UI created.
- ⏳ Canonical web intent-first signup handoff to OTP.
- ⏳ Consolidate `/join`, legacy account-type, talent/publisher onboarding redirects without loops or duplicate registration states.
- ⏳ Align Google/Apple web social signup with required-phone completion.

## Security / release gates
- 🔒 PR #112 remains Draft and unmerged.
- 🔒 No public App Store / Google Play release.
- 🔒 No Production Auth template switch yet.
- 🔒 Staging privacy DDL is permitted for Build 11 integration; Production schema remains unchanged.
- 🔒 Do not enable RLS blindly on `marketing_events`, `roles`, `permissions`, `role_permissions`, `user_roles`; policies must be designed first.
- ⏳ Security policy cleanup for the five staging advisory tables.

## CI
- Latest tracked green checkpoint `c0fa52fd44158a120370f4734cac5fa221f49f7a`: Vercel Preview success.
- Latest source batch now also includes the iOS Sign in with Apple capability declaration, reusable polished single-select sheet, Arabic opportunities filter anchoring fix and comprehensive mobile nationality fallback; CI re-check pending.
- Re-check CI after every subsequent coherent source batch before marking it green.
