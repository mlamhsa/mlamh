# MLAMH — Quick Requests / طلبات الآن

Status: APPROVED PRODUCT PLAN
Date: 2026-09-13
Scope: Saudi Arabia launch, Actor + Model only

## Non-negotiable implementation guardrails

This plan must be implemented without breaking or replacing approved foundations.

- Do not rewrite or replace established core flows when the existing architecture can be extended safely.
- Do not perform broad refactors unrelated to the active task.
- Do not change canonical approval, auth, publisher, talent, opportunity, workspace, or chat behavior unless the change is explicitly required by this plan and reviewed against existing behavior.
- Do not introduce migrations, destructive DML, schema changes, or new parallel systems before inspecting current schema and proving they are necessary.
- Do not touch, delete, rewrite, normalize, re-seed, bulk-update, or otherwise mutate existing registered talent accounts, publisher accounts, profiles, applications, opportunities, conversations, messages, notifications, or other production records as part of this feature work.
- Existing talents and registered accounts are production data and must be treated as protected. Any necessary compatibility work must preserve their IDs, approvals, profile state, applications, conversations, and existing behavior.
- No backfill or data migration may run against existing production users unless it is separately reviewed, explicitly approved, reversible where possible, and required for the feature.
- Read-only inspection of existing data is allowed for compatibility/QA; mutation is not.
- Reuse existing `posting_mode=quick` for Quick Requests rather than creating a duplicate opportunity system.
- Reuse the existing qualification/matching engine and extend it only where required.
- Reuse and evolve the existing chat system rather than rebuilding messaging.
- Keep Casting Workspace and professional casting flows intact.
- Every implementation phase must be completed, tested, and closed before starting the next phase.
- All changes must preserve current production behavior outside the intended scope.
- Desktop, mobile, RTL, Safari/iPhone, auth, existing opportunity/application flows, existing registered accounts, and existing conversations must be regression-tested before release.
- If implementation requires touching an approved foundation or existing production data model, stop first, document the dependency, inspect the affected flow, and choose the smallest safe change.

---

## 1. Publisher identities

User-facing publisher choices:

1. فرد / صاحب مشروع
2. متجر / نشاط تجاري
3. شركة / مؤسسة / جهة

Preserve the existing backend `individual/organization` architecture where possible. Individual and small activity/store accounts use the fast path; professional organizations use the existing professional path.

---

## 2. Individual / project-owner onboarding

Goal: allow a legitimate new publisher to reach the first request quickly while preserving trust and abuse controls.

Required data:

- Full name
- Mobile number — mandatory from day one
- City
- Role / capacity, for example:
  - Project owner
  - Photographer
  - Content creator
  - Event organizer
  - Freelancer
  - Student project
  - Other
- Why they use MLAMH / intended use
- Project or activity name when applicable
- Introductory link or social account when needed for trust/risk review
- Existing login email/account identity

Phone rules now:

- Phone is mandatory but not OTP-verified yet.
- Never display "verified phone" until actual OTP verification exists.
- Phone must not be exposed to talent.
- Future WhatsApp/SMS OTP should verify the same stored number rather than redesign onboarding.

---

## 3. Store / small business onboarding

Required lightweight data:

- Responsible person's name
- Mobile number
- City
- Activity/business name
- Activity type, e.g. fashion store, salon, restaurant, e-commerce, photography studio, events, other
- Activity/site/social link when available or required by trust review

Do not require company-grade documentation merely because the user is a small activity/store.
Do not show a verified-business badge without real verification.

---

## 4. Companies / institutions / organizations

Keep the existing professional publisher path and existing review/verification separation.

Typical fields remain:

- Organization name
- Account/contact person
- Organization type
- City
- Logo/profile image
- Professional profile fields
- Account approval
- Organization verification as a separate status

Do not weaken the professional flow to match the individual path.

---

## 5. Quick Request creation

### Individual / small activity

Do not first present an equal-weight chooser between Quick Opportunity and Project/Casting.

Primary action goes directly to:

> وش تحتاج؟

The publisher writes the need naturally, WhatsApp-style.

Example:

> احتاج مودل بنت بالرياض بكرة لتصوير عبايات ساعتين والميزانية 700 ريال

MLAMH structures it into a preview such as:

- Model
- Female
- Riyadh
- Tomorrow
- 2 hours
- SAR 700
- Abaya shoot

Ask at most one truly essential missing question before preview/continuation.

Secondary path at the bottom:

> لدي مشروع / كاستينغ بتفاصيل أكبر

### Company / organization

Companies may see both options explicitly:

- ⚡ طلب سريع
- 🎬 مشروع / كاستينغ

---

## 6. Naming

Publisher-facing:

- ⚡ طلب سريع

Talent-facing:

- ⚡ طلبات الآن

Professional path:

- 🎬 مشروع / كاستينغ
- 🎬 فرص الكاستينغ

Technical foundation:

- `posting_mode=quick` evolves into Quick Requests.
- `posting_mode=project` remains the professional casting/project path.

Do not create a parallel request platform when the current opportunity model can safely support the service.

---

## 7. Publishing — current phase

Until company/payment setup is ready:

- Keep the current opportunity review behavior.
- Do not build partial/fake payment flows.
- Apply stronger risk review to first requests from new individual accounts and ambiguous/suspicious requests.

Higher-risk examples include:

- unclear personal requests
- "other" use cases without sufficient context
- behavior focused on reaching a specific talent without a legitimate job need
- abnormal invitation behavior

---

## 8. Publishing — future paid phase

After official payment activation:

Write request → Preview → Pay → Automated risk/safety check → Publish

Low-risk paid requests should publish quickly.
Flagged requests should go to manual review.
Failed payment must never produce a public request.

---

## 9. Trust and anti-abuse rules

Core rule:

> لا توجد دعوة لموهبة بدون طلب حقيقي منشور ومقبول داخل ملامح.

Required protections:

- No unrestricted publisher-to-talent DMs.
- Invitations must be tied to a real published request/opportunity.
- No public phone numbers or direct WhatsApp exposure.
- Stronger risk review for first requests from new individual accounts.
- Report and block capabilities.
- Rate limits and anomaly detection for invitations/contact attempts.
- Prevent a user from creating a fake opportunity solely to reach a specific talent.
- Later, payment and phone/business verification add additional trust friction.

Trust labels must never imply verification that has not happened.

---

## 10. Public opportunities as acquisition

Public opportunity pages remain visible to visitors.

CTA by content type:

- Quick Request: "أنا مهتم"
- Casting Opportunity: "التقديم على الفرصة"

If the visitor is not registered:

- start talent registration/login
- preserve the originating opportunity ID/slug
- after required onboarding/profile completion, return the user to the same opportunity

---

## 11. Homepage opportunities section

Recommended framing:

> فرص وطلبات جديدة
> اكتشف من يبحث عن مواهب الآن

Cards distinguish:

- ⚡ طلب الآن
- 🎬 كاستينغ

Primary CTA:

> عرض جميع الفرص والطلبات

---

## 12. Talent opportunities page

Keep primary navigation item:

> الفرص

Inside:

- ⚡ طلبات الآن
- 🎬 فرص الكاستينغ

Matching is a filter:

- ☑ مناسب لي

Do not create a third redundant top-level tab named "مناسب لي".

---

## 13. Matching

Reuse the current qualification/supply engine.

Respect hard requirements such as talent type, gender, age when required, city requirements, and explicit brief requirements.

Travel behavior:

- Same-city suitable talent ranks first.
- If talent opted into travel/work outside city and request allows it, other-city opportunities can appear as suitable.
- Label other-city matches clearly, e.g. `✈️ يتطلب السفر إلى جدة`.
- Publisher local-only requirements override talent travel willingness.

Do not create a second matching engine.

---

## 14. Talent dashboard — approved talent

Recommended order:

1. Important alert when applicable
2. "مناسب لك اليوم" — actual matched requests/opportunities
3. Invitations/new-message attention cards when present
4. Compact metrics: profile strength / applications / messages
5. "متاح للعمل الآن" control when implemented
6. Current activity / application-interest status
7. "طوّر ملفك" tools: professional details / portfolio / subscription

For approved talent:

- Reduce/remove the repetitive large "أنت جاهز للفرص" block once real matched opportunities are shown.
- Reduce "اعتمادك محفوظ" to a compact approved indicator except when a real status event requires attention.
- Move "أدوات إضافية" lower in the page.

Pending/non-approved talent keeps approval/readiness as the primary dashboard priority.

---

## 15. Talent mobile bottom navigation

Target:

- الرئيسية
- الفرص
- طلباتي
- الرسائل
- ملفي

Confirm actual rendered mobile shell against current code before changing anything.

---

## 16. Talent "طلباتي"

Eventually unify:

- Quick Request interests
- Casting applications

Recommended filters:

- الكل
- اهتماماتي ⚡
- تقديماتي 🎬

---

## 17. Two-way interest and contact

### Talent starts

Talent taps `مهتم`.
A request-linked contact context is created. Either side may send the first message once the relationship is valid.

### Publisher starts

Publisher sends `دعوة` tied to a published request. The publisher may start the request-linked conversation; the talent may respond.

No unrestricted DM outside request context.

---

## 18. Chat

Reuse existing chat. Add only what is required:

- pinned request context
- counterparty context
- system messages
- request/contact status
- existing realtime, read state, typing, attachments, voice, notifications, report/block

Do not rebuild chat from scratch.

---

## 19. Public talent directory

For an eligible logged-in publisher with published requests:

- View profile
- Invite to opportunity/request

Inside a specific request's matched-talent list:

- `دعوة لهذا الطلب`

Do not allow arbitrary invitation without an eligible published request.

---

## 20. Unregistered publisher viewing a talent

If a visitor wants to contact a talent:

- register/login as publisher
- create a legitimate request
- preserve originating talent ID
- after request creation/publication eligibility, return to that talent and offer invitation to the request

---

## 21. Trust states

Current display may identify account context such as individual, activity, or organization, but must not imply verified status.

Future verified states may include:

- verified phone after real OTP
- verified organization after real business verification

---

## 22. Deferred items

Do not implement now:

- OTP / WhatsApp OTP / SMS OTP
- new payment system
- escrow
- contracts
- advanced booking flows
- international launch expansion
- talent categories beyond Actor/Model
- Casting Workspace rewrite

---

## 23. Implementation order

1. Publisher onboarding
2. Quick Request creation
3. Public Opportunities acquisition flow
4. Talent Dashboard
5. Matching/travel behavior
6. Interest + Invitations
7. Talent Directory invitations
8. Chat integration
9. Notifications + statuses
10. Trust / anti-abuse hardening
11. Final Desktop + Mobile + Safari/iPhone E2E

Do not skip ahead. Close and test each phase before starting the next.
