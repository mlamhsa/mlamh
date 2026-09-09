# MLAMH Talent Flow V1

Status: APPROVED / IMPLEMENTATION IN PROGRESS
Date: 2026-09-09

## Product principle
Talent onboarding must be short, non-repetitive, and dashboard-first. Data collected once must not be requested again unless the user edits it.

## Canonical flow
1. Choose use case: Talent / Looking for talent.
2. Create account and collect required talent basics.
3. Enter Talent Dashboard immediately.
4. Complete professional profile and portfolio from the dashboard.
5. System evaluates approval readiness and profile strength separately.
6. Eligible profiles can be auto-approved; exceptions go to manual admin review.
7. Approved public profiles appear in the public talent directory. Approved private profiles never appear publicly but remain available for private matching/Brief workflows.

## Signup behavior
### Email signup
Collect the full required signup dataset during account creation.

### Google signup
Use reliable Google-provided fields and then show a required-data completion screen containing only missing fields. Google and email users end with the same data model and permissions.

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

## Completion vs readiness
MLAMH must expose two separate concepts:
- Approval readiness: whether all hard approval gates are satisfied.
- Profile strength/completion: how complete and useful the profile is for matching and ranking.

Dashboard messaging must explain that completing optional data improves matching quality and increases the chance of being surfaced in relevant recommendations without promising guaranteed selection.

## Visibility
### Public
- May appear in the public talent directory only after approval.
- Eligible for matching and Brief workflows.

### Private
- Must never appear in the public directory, public search, public profile indexing, sitemap or SEO surfaces.
- Remains eligible for private matching and Brief workflows.
- Admin must see a clear Private badge and filter.

Visibility applies to every talent user regardless of gender or any other demographic field.

## Auto approval
Auto approval must not be based on percentage alone. It requires:
- configured completion/readiness threshold
- all hard gates satisfied
- valid main image
- no blocking review/risk state

Profiles failing an automated gate are routed to manual review.

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

## Professional Profile UX
The professional profile is one organized page with section anchors. Clicking an anchor scrolls to the relevant section. Required items are marked clearly and incomplete required sections expose a direct action.

Suggested sections:
- Basic information
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
