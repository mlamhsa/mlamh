# MLAMH Native Mobile ↔ Web Reconciliation — 2026-09-05

Source of truth for current product behavior: latest `main` + production schema. Native target: shared Expo/React Native code for iOS and Android, reusing the same backend/business rules.

## Rule
A user-facing web decision is reviewed for native impact before Mobile RC is considered complete. Admin-only, SEO-only and desktop/mobile-web implementation details are not copied blindly into native.

## Current reconciliation status

### Auth / onboarding
- [IN PROGRESS] Native signup/login visual system reconciled with current web palette.
- [IN PROGRESS] Native talent onboarding error handling hardened.
- [OPEN] Email confirmation should return to native when confirmation originated from the app.
- [OPEN] Auth email visual template and deliverability review.

### Talent profile / approval
- [FIXED] Review submission now uses the shared `getTalentProfileReviewReadiness` rules instead of an extra native-only 35% gate.
- [OPEN — HIGH] Native editor exposes only name/bio/skills while web supports the full canonical talent profile. Native must support all fields required to become review-ready: profile photo, Actor/Model role, city, gender, date of birth, nationality, plus the current optional professional/measurement fields that materially affect matching.
- [OPEN — HIGH] Native readiness UI must show the same required fields as web and never invent native-only readiness requirements.
- [OPEN] Changes-requested reason / pending profile-change behavior must be surfaced consistently.
- [OPEN] Canonical nationality/city/option lists must be shared or generated from the same source to prevent value drift.

### Privacy / talent visibility
- [VERIFY BEFORE RC] Public/private media visibility and post-acceptance access rules must remain aligned with `lib/talent/public-profile-access.ts` and current production RLS.
- [VERIFY BEFORE RC] Do not expose private visual content or private talent links to unauthorised users.

### Opportunities / applications
- [IN PROGRESS] Native opportunity directory visual reconciliation.
- [OPEN] Opportunity detail, compensation, managed-by-MLAMH state, market/currency and application eligibility must match current web/backend contracts.
- [OPEN] Application statuses and accept/reject transitions must use the same backend state machine.

### Publisher
- [OPEN] Publisher dashboard/opportunity lifecycle/applicant decisions/messages need visual + contract reconciliation.
- [OPEN] Review whether native publisher onboarding is required for RC or existing-publisher sign-in is the intended launch scope; do not create a second onboarding model.

### Multi-country
- [VERIFY BEFORE RC] Native discovery/account market resolution must follow current market architecture and never hardcode Saudi business rules where account/opportunity country is already available.
- [VERIFY BEFORE RC] Currency/country/city display and opportunity creation must use canonical market data.

### Monetization / entitlements
- [VERIFY BEFORE RC] Current featured-talent state is entitlement-derived on web. Native must not trust stale `featured` flags for any public ranking/display that it implements.
- [NOT NATIVE ADMIN SCOPE] Entitlement revoke/reactivate controls remain admin web functionality unless a user-facing subscription-management requirement is approved.

### Casting / Marketing Hub
- [WEB/ADMIN SCOPE] Marketing Hub operational tools remain web admin functionality.
- [REVIEW FOR NATIVE ENTRY POINT] Casting Brief CTA is a public demand-acquisition decision. Native may link to the canonical web brief flow; it should not duplicate Marketing Hub logic.

### Legal / support
- [OPEN — HIGH] Native must expose canonical Privacy, Terms, Refund/Cancellation and Complaints/Support paths, using current web legal content as source of truth rather than duplicating stale native copies.

### UX / platform quality
- [IN PROGRESS] Black/gold visual tokens match current web source (`#050505`, `#F5F5F0`, `#C9A962`, `#D4AF6A`, dark surfaces).
- [IN PROGRESS] Remove fabricated `M` identity marks, decorative glyphs and oversized cards/CTAs.
- [OPEN] Loading, empty, retry and form feedback patterns should match current web intent while remaining native for iOS/Android.
- [OPEN] Arabic RTL and English LTR must be reviewed screen-by-screen on both platforms.

## Explicit non-goals
- Do not copy SEO/sitemap/server-rendering concerns into native.
- Do not duplicate Marketing Hub/admin tooling in the native app.
- Do not create a separate native backend or business-rule fork.
- No production deployment, production DML/migration, App Store or Play production release without explicit approval.
