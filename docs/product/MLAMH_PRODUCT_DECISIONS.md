# MLAMH Product Decisions

This file records approved product direction so implementation remains consistent across web, mobile, admin, data, matching, SEO and future work.

## 2026-09-09 — Talent Flow V1 approved
Status: APPROVED / IMPLEMENTATION IN PROGRESS

### Decision
MLAMH will finish the Talent product flow completely before moving to Publisher redesign, then Brief/Workspace.

### Canonical Talent onboarding
Talent / Looking for talent → Account creation + required basics → Email OTP verification (for email/password signup) → Talent Dashboard → Complete professional profile/portfolio → Approval readiness → Auto/manual approval → Public/private visibility behavior → Opportunity participation.

### Registration rules
- Email signup collects all required talent basics.
- Email/password signup uses a 6-digit OTP verification experience inside MLAMH.
- The Supabase signup email template must expose the OTP token (`{{ .Token }}`); a confirmation-link-only email is not the canonical UX.
- Google signup reuses trustworthy Google data and asks only for missing required data.
- No repeated Actor/Model or talent-type confirmation screen after signup.
- Profile visibility is required for every talent user without demographic exceptions.
- Verification pages must respect the global navigation height so titles and controls are never hidden at the top of the viewport.

### Talent taxonomy direction
Expand beyond Actor and Model into a broader talent list. Do not mix production crew roles into Talent taxonomy. Production crew/creative marketplace is a separate future expansion.

Initial talent categories under product review/implementation:
- Actor
- Model
- Voice Over
- Presenter / Host
- Content Creator
- Dancer
- Singer
- Musician
- Extra
- Influencer

### Approval
Main profile image is required for approval/public presence. Bio, languages and skills are optional for approval but improve profile strength and matching quality.

Auto approval is allowed when configured readiness conditions are met; percentage alone is insufficient. Manual review remains for exceptions/risk cases.

### Visibility
- Public approved profiles may appear on the public site.
- Private approved profiles never appear publicly but remain available for private matching/Brief workflows.
- Admin must clearly see whether the talent chose Public or Private.

### Dashboard
Desktop: persistent sidebar + adjacent page content.
Mobile: retain mobile-native navigation.
Add Portfolio as a first-class destination.

### Product separation
Opportunity remains the self-service publisher flow: publish → talent applies → publisher selects → communication opens.
Brief/Workspace is a separate advanced B2B/casting-company product to be designed after Talent and Publisher flows are complete.

### Implementation rule
Every product change must be reviewed project-wide, including data model, auth/onboarding, dashboard, public directory/search, qualification/matching, admin, SEO, RTL/i18n, mobile/web, legacy compatibility and tests.
