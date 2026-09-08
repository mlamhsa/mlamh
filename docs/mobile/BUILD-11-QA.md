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
- 🟡 Apple OAuth source path exists; Apple Developer + Supabase provider configuration and real-iPhone verification remain.
- 🔒 Production Supabase Confirm Signup template must not switch to OTP until mobile + web canonical flows are ready.
- 🔒 Existing registered accounts must remain untouched/backward-compatible.

## Account data
- ✅ `profiles.phone` is the canonical application phone field.
- ✅ Account context exposes phone, phone verification state and onboarding step.
- ✅ Account details API creates/updates the profile after auth and social signup.
- ✅ Phone remains unverified until future SMS OTP (`phone_verified_at` null).
- ⏳ Settings/Admin surfaces must be audited to consistently show canonical phone and verification state.

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
- ⏳ Opportunities Arabic filters start visually from right.
- ⏳ All opportunity/DOB UI dates use Gregorian calendar + Latin digits 0–9.
- ⏳ Gallery RTL ordering starts from right.
- ⏳ Gallery cards/images reduced to professional mobile sizing.
- ⏳ Gallery native drag-and-drop; remove `تقديم` / `تأخير`.
- ⏳ Clear primary-photo feedback.
- ✅ Gallery fullscreen safe-area: Build 10 physical-device PASS.
- ⏳ Nationality selector comprehensive/mobile-native redesign.
- ⏳ Measurements & Appearance redesign.
- ⏳ In-place language switching without app relaunch.
- ⏳ Password recovery authenticated-context behavior.
- ⏳ Support form RTL alignment.
- ⏳ Legal document tab switch resets scroll to top.
- ⏳ Back navigation reliability.
- ⏳ Required-field gold-star consistency across all forms.
- ⏳ Bottom navigation Arabic visual order audit.

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
- Latest tracked checkpoint `c0fa52fd44158a120370f4734cac5fa221f49f7a`: Vercel Preview success.
- Re-check CI after every subsequent coherent source batch before marking it green.
