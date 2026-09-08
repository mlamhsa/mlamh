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
- ✅ Web 6-digit Email OTP UI and canonical email-signup handoff implemented in source.
- ✅ Web OTP verification now creates/updates the canonical `profiles` account record from verified Auth metadata before continuing onboarding.
- ✅ Required mobile number captured for email signup.
- ✅ Social signup completion requires name + canonical mobile number for Google/Apple users before onboarding.
- ✅ Google and Apple mobile signup entries converge through the same callback/account completion path.
- ✅ Web Google + Apple signup entries converge through `/auth/callback` and the same required-phone account-completion page.
- ✅ Pending social signup context has a 30-minute TTL and carries intent/locale/terms acceptance on mobile.
- ✅ No continuous field autosave in the web quick registration form; save occurs on explicit submission.
- 🟡 Google callback source fix needs Build 11 physical-device verification.
- 🟡 Apple OAuth source path exists; iOS app config now declares `usesAppleSignIn: true`. Apple Developer + Supabase provider configuration and real-iPhone verification remain.
- 🔒 Production Supabase Confirm Signup template must not switch to OTP until preview/integration verification of the new web + mobile clients passes.
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
- ✅ Intent avoids asking Actor/Model twice where known on mobile.
- ✅ Journey orchestrator routes to the next real incomplete step.
- ✅ Core data → privacy when applicable → photos → review.
- ✅ Formal Journey Progress remains 25 / 50 / 75 / 100 and stays distinct from Profile Completion/Review Readiness.
- 🟡 Profile editor now uses explicit Save & Continue, validates actual review-required fields, and warns before leaving with unsaved changes; Build 11 verification required.
- 🟡 Mid-onboarding relaunch canonical route fix needs Build 11 physical-device verification.
- ✅ Web signup now carries Actor/Model intent into talent setup and does not ask the same role question again when the intent is known.
- ✅ Web talent draft creation now keeps onboarding as `profile_in_progress` / `core_data` instead of incorrectly marking the account completed immediately after choosing a role.
- 🟡 Web talent setup now routes directly to the next profile step after saving the role; preview/regression verification required.
- ⏳ Remaining screen-by-screen copy/CTA consistency audit outside profile/publisher setup.

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
- 🟡 Opportunity details and DOB source formatters explicitly use Gregorian calendar + Latin numbering; profile DOB formatter/picker has also been hardened to Gregorian + Latin numbering. Remaining opportunity/list/date surfaces still require audit and Build 11 verification before closing this item.
- 🟡 Gallery RTL ordering is implemented in the new draggable strip so the logical first image starts from the right in Arabic; Build 11 device verification required.
- 🟡 Gallery cards/images are reduced to compact mobile-native sizing so multiple photos remain visible; Build 11 verification required.
- 🟡 Native-feeling long-press horizontal drag reorder is integrated in source with RTL-aware movement, subtle scale/vibration feedback and auto-save on drop; textual `تقديم` / `تأخير` controls are removed from the active route. Build 11 physical-device verification required.
- 🟡 Primary-photo feedback now updates the top primary card immediately, keeps the `الرئيسية` badge/`هذه الصورة الرئيسية` state, and shows a short non-blocking confirmation; Build 11 verification required.
- ✅ Gallery fullscreen safe-area: Build 10 physical-device PASS; the new route preserves the same safe-area treatment and must be regression-checked on Build 11.
- 🟡 Canonical nationality dataset expanded substantially across GCC, Arab, European, Asian, African, North/South American and Oceania markets.
- ✅ Mobile nationality fallback is comprehensive, so a profile-options API outage no longer collapses the selector back to the old limited list.
- 🟡 Nationality selector is now integrated into the profile editor using the polished single-select sheet with search, current selection, draft selection, explicit confirmation, RTL and empty state; Build 11 verification required.
- 🟡 Measurements & Appearance source redesigned into optional compact metric cards plus clean selectors instead of the dense chip wall; Build 11 verification required.
- 🟡 Required-field gold-star UX is implemented in Talent profile edit and Support, and Publisher setup now follows the same convention. Remaining forms still require audit.
- 🟡 Settings language switching now updates in place without route replacement/relaunch; Build 11 verification required.
- 🟡 Password recovery now prefills the signed-in account email and uses a context-aware return action; Build 11 verification required.
- 🟡 Support email/mobile labels and values now align correctly for Arabic while preserving LTR value direction; Build 11 verification required.
- 🟡 Legal document switching now resets scroll position to the top; Build 11 verification required.
- ⏳ Back navigation reliability audit across remaining auth/onboarding screens.
- 🟡 Bottom navigation source audit confirms the physical order is Opportunities → Applications → Messages → Profile, which renders Profile at the far right for Arabic; Build 11 device verification remains required.

## Publisher onboarding
- 🟡 Publisher setup source now uses a guided step card, explicit required fields, Save & Continue, inline validation and unsaved-change guard; Build 11 verification required.
- ⏳ Value/brief-led publisher journey beyond identity setup remains to be designed against the existing publisher APIs without inventing unsupported AI features.
- ⏳ Ensure Admin publisher phone/source-of-truth and onboarding state are surfaced consistently.

## Web / route cleanup
- ✅ Web `/join` is now intent-first with three explicit goals: Acting / Modeling / Find talent, matching the mobile product language.
- ✅ Web quick form no longer continuously writes registration fields to session storage.
- ✅ Web email signup performs client-side Auth signup and routes directly to the 6-digit OTP screen rather than the legacy login/confirmation-link message.
- ✅ Web OTP verification creates the canonical application profile before routing onward.
- ✅ Google + Apple web signup share one callback and required-phone completion flow, and now receive the selected intent.
- ✅ OAuth callback no longer falls back to the legacy `/join/account-type` page for unresolved new accounts; it returns to canonical `/join` instead.
- 🟡 Legacy `/join/account-type` remains only as backward-compatible recovery for authenticated old accounts with no saved account type; retire after route/regression verification.
- 🟡 Web canonical join rewrite requires Vercel Preview/regression verification before this section is considered release-ready.

## Security / release gates
- 🔒 PR #112 remains Draft and unmerged.
- 🔒 No public App Store / Google Play release.
- 🔒 No Production Auth template switch yet.
- 🔒 Staging privacy DDL is permitted for Build 11 integration; Production schema remains unchanged.
- 🔒 Do not enable RLS blindly on `marketing_events`, `roles`, `permissions`, `role_permissions`, `user_roles`; policies must be designed first.
- ⏳ Security policy cleanup for the five staging advisory tables.

## CI
- Green checkpoint `3ad401fd4293bfdb1042bc5de304781ba5d565d5`: Vercel Preview success after the profile editor/nationality/measurements rewrite.
- Latest source batch includes the canonical intent-first web join rewrite, intent-aware web talent setup, onboarding-state correction, guided Publisher setup and the compact RTL drag-and-drop gallery route.
- Re-check CI after every subsequent coherent source batch before marking it green.
