# MLAMH Quick Requests — Implementation Status

Last updated: 2026-09-13

## Guardrails
- Do not modify existing talent records or registered account data.
- Do not run migrations/backfills on Production without separate review and approval.
- Do not refactor approved foundations unless strictly required.
- Preserve current IDs, approval states, conversations, opportunities, applications, and production data.
- Work phase-by-phase; close and verify each phase before starting the next.

## Phase 1 — Publisher Onboarding
Status: CLOSED / merged to `main` via PR #319 after successful Vercel validation.

Implemented:
- Added three user-facing publisher choices: Individual / Project owner, Store / Business, Company / Organization.
- Preserved the canonical backend split: fast-track uses `publisher_type=individual`; professional organizations keep existing publisher types.
- Fast-track requires full name, mobile number, city, role/use case or business identity, with optional social/profile link.
- Reused existing `publishers.publisher_type_other`; no schema migration.
- Added compatibility guard so established accounts / accounts with opportunities are not rewritten.
- No talent, application, message, conversation, or opportunity records were modified.

## Phase 2 — Quick Request Creation
Status: CLOSED / merged to `main` via PR #321 after successful Vercel validation.

Implemented:
- Kept existing `posting_mode=quick`; no parallel request system.
- Fast-track publishers enter the WhatsApp-style “What do you need?” flow directly.
- Professional organizations retain Quick Request vs Project / Casting.
- Added isolated deterministic parser and structured editable preview.
- Uses the existing `/api/create-opportunity` and current review flow.
- No payment, migration, backfill, or mutation of existing production data.

## Phase 3 — Public Opportunities
Status: CLOSED / merged to `main` via PR #322 after successful Vercel validation.

Implemented:
- Public browsing remains open.
- Homepage desktop/mobile now distinguishes `⚡ طلب الآن` from Casting.
- Added additive public routes:
  - `/{locale}/opportunities/quick`
  - `/{locale}/opportunities/casting`
- Added two-option opportunity navigation: `طلبات الآن` and `فرص الكاستينغ`.
- Legacy/null `posting_mode` opportunities remain visible under Casting for backward compatibility.
- Added visitor-to-talent acquisition CTA while preserving the current auth/application foundation.
- Read-only Production check confirmed no slug conflict for `quick` or `casting`.
- No opportunity, talent, account, application, message, or conversation records were modified.
- Automatic return-to-the-same-opportunity after auth remains deferred to avoid changing the approved auth/callback foundation prematurely.

## Phase 4 — Talent Dashboard
Status: CLOSED / merged to `main` via PR #323 after successful Vercel validation.

Implemented:
- Added `مناسب لك اليوم / Matched for you today` for approved talent.
- Reused the existing `evaluateTalentForBrief` matching engine; no duplicate matching system.
- Shows Quick Requests and Casting opportunities with clear labels.
- Added smart empty state for Quick Requests, Casting, and profile improvement.
- Surfaces unread-message attention only when relevant.
- Moved additional profile/account tools below the core dashboard content.
- Kept non-approved talent states focused on completion/review readiness.
- No talent/account/application/message/conversation records were modified.

## Phase 5 — Matching
Status: CLOSED / merged to `main` via PR #325 after successful Vercel validation.

Implemented:
- Extended the existing Qualification/Supply engine; no duplicate matching engine.
- Added explicit city match states: `local`, `travel`, `none`.
- Exact-city matches remain strongest and are ranked first on the talent dashboard.
- Out-of-city matches require both request flexibility and talent opt-in via `ready_to_travel` or `work_outside_city`.
- Publisher local-only requirements override talent travel willingness.
- Added Quick Request city-flexibility checkbox, persisted in existing `role_requirements.city_flexible` JSONB; no migration.
- Existing opportunities without the flag remain local-only by default.
- Talent dashboard displays `✈️ يتطلب السفر إلى ...` for travel matches.
- Added regression coverage for local, flexible, travel-enabled, and local-only cases.
- No migration/backfill or production data mutation.

## Phase 6 — Interest + Invitations
Status: CLOSED / merged to `main` via PR #326 after successful Vercel validation.

Implemented:
- Reused `opportunity_applications` as the talent-initiated interest signal for Quick Requests; no separate interests table.
- Approved talents can tap `مهتم / Interested` from the public Quick Requests directory.
- Existing application row displays as `تم إرسال اهتمامك ✓` for Quick Requests.
- Casting opportunities retain the current application flow and semantics.
- Replaced the old talent `/requests` redirect with an actual publisher-invitation inbox.
- Reused `opportunity_invitations.status` for consent: `sent` → `accepted` or `declined`.
- Invitation responses are ownership-checked against the signed-in talent.
- Acceptance explicitly keeps contact inside MLAMH; phone/WhatsApp are not exposed.
- Optional interest note was not added because no confirmed safe existing field was established; no column/schema was invented.
- No migration/backfill or parallel invitation/application system was introduced.

## Phase 7 — Talent Directory Invitations
Status: CLOSED / merged to `main` via PR #329 after successful Vercel validation.

Implemented:
- Reused the existing public talent directory and `PublisherTalentInvitePanel` invitation foundation.
- Publisher viewers now see a direct `دعوة للتواصل / Invite` shortcut on public talent cards.
- The shortcut opens the existing invitation section on the talent profile instead of duplicating invitation UI or authorization.
- Guests and talent accounts keep the existing directory-card behavior.
- Existing server-side publisher eligibility, talent visibility and privacy checks remain authoritative.
- No migration/backfill, phone exposure, or parallel invitation system.

## Phase 8 — Chat Integration
Status: CLOSED / merged to `main` via PR #331 after successful Vercel validation.

Implemented:
- Reused the existing realtime MLAMH chat foundation; no second messaging system.
- Quick Request talent interest creates/reuses a conversation tied to the same opportunity and application.
- Publisher opportunity invitations create/reuse an opportunity-linked conversation immediately, allowing the publisher to send the first message.
- Every new publisher↔talent conversation requires an opportunity, publisher and talent context; no open unsolicited DMs were introduced.
- Added an idempotent opportunity-conversation helper that prevents duplicate chats and links a later talent application to an invite-created conversation.
- Conversation detail access now follows actual conversation membership, matching the existing secure message action.
- Traditional Casting/Project applications remain accepted-first because their conversation is still created only by the existing acceptance flow.
- Invitation decline closes the request conversation only when the talent has not independently expressed interest in the same opportunity.
- Existing realtime messages, attachments, voice, drafts, reporting and close behavior remain unchanged.
- Phone/WhatsApp remain hidden; no migration/backfill.

## Phase 9 — Notifications + Statuses
Status: CLOSED / merged to `main` via PR #332 after successful Vercel validation.

Implemented:
- Reused the existing Events → NotificationHandler → Notifications pipeline; no second notification system.
- Added in-app events for Quick Request talent interest and publisher invitation accepted/declined responses.
- Quick Request interest notifies the owning publisher with talent/request context and the linked conversation ID.
- Opportunity invitation notifications carry the request-linked conversation ID so talent can open the related chat directly.
- Invitation accepted/declined responses notify the publisher and route to the related conversation when available.
- Notification routing verifies conversation ownership before redirecting either party into chat.
- Fixed invitation consent semantics: opening an opportunity-invitation notification no longer changes `opportunity_invitations.status` to `viewed`; notification read state is stored only in `notifications.is_read`, preserving `sent → accepted/declined`.
- Managed Casting invitation behavior and existing Casting application notification semantics remain unchanged.
- New Quick Request events remain in-app only; no new email delivery was enabled.
- No migration/backfill or phone/WhatsApp exposure.

## Phase 10 — Trust / Anti-abuse
Status: NEXT

Scope:
- Reuse existing authentication, publisher/talent eligibility checks, reporting, conversation close controls and private contact rules.
- Verify that Quick Request interest/invitation cannot bypass account restrictions, profile approval, talent visibility or publisher eligibility.
- Prevent repeated invite/contact abuse without creating a new moderation platform.
- Keep contact inside MLAMH and prevent accidental phone/WhatsApp exposure in Quick Request surfaces.
- Preserve existing report flows and admin review paths; strengthen only where a concrete gap exists.
- OTP/payment/business verification remain deferred and must not be simulated with misleading badges.
- No migration/backfill unless separately reviewed.

## Remaining phases
11. Final Desktop + Mobile E2E
