# MLAMH Talent Flow V1

Status: APPROVED / IMPLEMENTATION IN PROGRESS
Date: 2026-09-09

## Product principle
Talent onboarding must be short, non-repetitive, and dashboard-first. Data collected once must not be requested again unless the user edits it.

## Canonical flow
1. Choose use case: Talent / Looking for talent.
2. Create account and collect required talent basics.
3. Verify email with a 6-digit OTP for email/password signup.
4. Enter Talent Dashboard immediately.
5. Complete professional profile and portfolio from the dashboard.
6. System evaluates approval readiness and profile strength separately.
7. Eligible profiles can be auto-approved; exceptions go to manual admin review.
8. Approved public profiles appear in the public talent directory. Approved private profiles never appear publicly but remain available for private matching/Brief workflows.

## Signup behavior
### Email signup
Collect the full required signup dataset during account creation.

Email/password signup uses a 6-digit email OTP verification experience inside MLAMH. The user should not be required to leave MLAMH and rely on a confirmation-link-only experience. The verification screen must remain visually below the global navigation on desktop/mobile and keep its title, email, code input, resend state and errors fully visible.

Supabase email templates for the signup verification flow must render the OTP token (`{{ .Token }}`) rather than only `{{ .ConfirmationURL }}`). Link-based confirmation may remain as a compatibility fallback during transition, but OTP is the canonical MLAMH user experience.

Hosted Supabase setup and the exact MLAMH email template are documented in `docs/auth/EMAIL_OTP_SETUP.md`.

Talent Flow V1 closeout requires a real inbox smoke test proving the hosted Supabase Confirm signup template sends a usable 6-digit code and the code completes account setup into the Talent Dashboard.

### Google / Apple signup
Use reliable provider-supplied fields and then show a required-data completion screen containing only missing fields. Google, Apple and email users end with the same MLAMH account/profile model and permissions.

Apple users who choose Hide My Email may receive an Apple relay email. A relay address and the user's personal email must not be auto-merged merely because they may belong to the same person. Identity linking must remain explicit and secure.

### Duplicate-account guard across providers
A normalized email address represents one MLAMH account regardless of whether the user originally registered with Google, Apple or email/password.

Rules:
- Before email/password signup, check Supabase Auth for an existing user with the normalized email.
- If the email already exists, do not start a second registration flow.
- Show a clear existing-account message with direct actions for Sign in and Forgot password.
- If the existing identity is Google-only, explain that the account was created with Google and direct the user to sign in with the same Google account.
- If the existing identity is Apple-only, explain that the account was created with Apple and direct the user to sign in with the same Apple account.
- If a user starts Google or Apple OAuth with an email that already belongs to an MLAMH account, the existing account type/profile remains authoritative. OAuth may attach an identity to the same Auth user, but must not create a second talent/publisher onboarding journey or change the existing account type.
- Existing registered talent data is never rewritten merely because the user attempted another signup method.
- Different Apple Hide My Email relay addresses are not auto-merged with another email account without secure explicit identity linking.

## Required signup data
- Full name
- Mobile number
- Nationality
- Gender
- Country of residence
- City (dependent on country)
- Talent type
- Profile visibility: public / private
- Terms and Privacy acceptance
- Data accuracy / contact consent

## Approval requirements
The following are hard requirements before approval/public readiness:
- Full name
- Mobile number
- Nationality
- Gender
- Country of residence
- City
- Talent type
- Date of birth
- Main profile image
- Profile visibility choice
- Required consents

Bio, languages, skills, experience, additional media and portfolio items are optional for approval.

Legacy/incomplete Talent accounts must be able to satisfy missing new hard gates through explicit self-service UI. Current Talent Flow V1 provides self-service country-of-residence selection, Public/Private visibility selection and data-accuracy/contact confirmation instead of silently backfilling those fields.

## Completion vs readiness
MLAMH must expose two separate concepts:
- Approval readiness: whether all hard approval gates are satisfied.
- Profile strength/completion: how complete and useful the profile is for matching and ranking.

Review submission is controlled by the required approval fields, not by an arbitrary completion percentage. The profile-strength percentage remains useful for ranking, matching and auto-approval decisions.

Recovery/reminder classification follows the same required-field readiness rule. A profile is `ready_not_submitted` when all canonical approval gates are satisfied; the old 35% completion threshold must not decide reminder classification.

Dashboard messaging must explain that completing optional data improves matching quality and increases the chance of being surfaced in relevant recommendations without promising guaranteed selection.

Profile-strength scoring must be fair across the complete Talent taxonomy. Actor and Model may use role-specific professional/measurement signals; other talent types must be able to reach the same 100% ceiling through relevant professional media, portfolio and social/professional signals without being forced to provide Actor/Model-specific measurements.

## Visibility
### Public
- May appear in the public talent directory only after approval.
- Eligible for matching and Brief workflows.

### Private
- Must never appear in the public directory, public search, public profile indexing, sitemap or SEO surfaces.
- Remains eligible for private matching and Brief workflows.
- Admin must see a clear Private badge and filter.

Visibility applies to every talent user regardless of gender or any other demographic field.

Talent can change Public/Private visibility from the Professional Profile page. The change is user-initiated and does not rewrite unrelated profile data. If an approved talent switches to Private, the public publication flag is disabled immediately. If an approved talent switches back to Public, public publication becomes eligible again under the approved state.

## Auto approval
Auto approval must not be based on percentage alone. It requires:
- profile strength/completion at or above the current fast-track threshold (70% in Talent Flow V1)
- all hard gates satisfied
- valid main image
- valid Public/Private visibility choice
- data accuracy/contact consent
- no blocking review/risk state

Profiles failing an automated gate are routed to manual review rather than silently rejected.

## Existing talent safety
Talent Flow V1 must not silently rewrite existing registered talent records.

Rules:
- No automatic backfill of existing talent category, city, nationality, privacy, publication state, status, image or professional-profile fields from new signup metadata.
- Existing incomplete talents are handled through reminder/recovery flows and explicit user edits.
- Recovery jobs may read existing records and log reminder events, but must not mutate talent profile data.
- A user-initiated edit or review submission may update that user's record normally.
- Missing legacy residence data must remain missing until the user explicitly selects a country; it must never silently default to Saudi Arabia.

## Talent Dashboard
Desktop uses a persistent right-side sidebar in Arabic (left-side in English), with the selected page rendered beside it.

Canonical sections:
- Home
- Professional Profile
- Portfolio
- Opportunities
- My Applications
- Messages
- Notifications
- Settings

Mobile keeps the mobile-native navigation pattern rather than copying the desktop sidebar.

The term **Workspace** is reserved for the future advanced Brief/casting product. Talent self-service surfaces must use **Talent Dashboard / لوحة الموهبة** and must not be presented as a Workspace.

Dashboard approval-readiness cards must show the same canonical hard gates as final review submission. Missing requirement rows should take the Talent directly to the relevant profile section rather than only showing a passive warning.

## Professional Profile UX
The professional profile is one organized page with section anchors. Clicking an anchor scrolls to the relevant section. Required items are marked clearly and incomplete required sections expose a direct action.

Current Talent Flow V1 profile editor behavior:
- horizontal section navigation is injected above the profile sections and scrolls to the selected section
- required identity fields are marked with a visible ⭐ indicator
- the legacy Actor/Model-only specialization control is replaced with the canonical full Talent taxonomy
- Public/Private profile visibility is editable in its own Privacy section
- data-accuracy/contact consent can be confirmed from the same Privacy section for legacy/incomplete accounts
- the legacy Saudi-only residence notice is removed because residence/city is now multi-country
- country of residence is an explicit editable approval gate
- city options in the profile editor are derived from the talent's saved country of residence rather than assuming Saudi Arabia
- profile-strength percentage remains separate from approval readiness

Suggested sections:
- Basic information
- Talent type
- About
- Appearance / measurements (type-specific)
- Skills
- Languages
- Experience
- Additional professional information
- Privacy / profile visibility

## Portfolio
Use one canonical Portfolio surface for profile image, additional photos, video/showreel, previous work and optional external links.

## Opportunity behavior
Talent may browse opportunities before approval. Applying requires the profile to meet the platform's approved/eligible state. Existing self-service publisher Opportunity flow remains separate from the future Brief/Workspace product.

## Scope boundary
Finish Talent Flow V1 before redesigning Publisher flow. Finish Publisher flow before implementing the advanced Brief/Workspace product.
