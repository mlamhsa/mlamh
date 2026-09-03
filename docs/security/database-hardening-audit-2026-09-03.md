# MLAMH Database Hardening Audit — 2026-09-03

## Scope

Security and performance review after the Multi-Country Foundation production milestone, followed by the explicitly approved minimal P0/P1 production hardening patch.

## Production baseline

- Project: `ozieysztwlispglupuox`
- Main baseline at audit start: `0dc46d9d7cd07a2fe14dad7b1b93e9b67f1e06a6`
- Multi-Country Foundation is already merged and deployed.
- Saudi Arabia remains the only active operational market.

## P0/P1 production hardening — VERIFIED

Applied production migration:

- `20260903072241_harden_privileged_functions_p0_p1`

Verified outcomes:

- `public.expire_featured_talents()` is no longer executable by `anon` or `authenticated`; `service_role` remains allowed.
- `public.is_conversation_participant(bigint)` is no longer executable by `anon`; `authenticated` remains allowed because message, attachment, and storage RLS policies depend on it.
- `public.set_contact_requests_updated_at()`, `public.set_updated_at()`, `public.claim_next_marketing_task(text)`, and `public.sync_marketing_agent_from_task()` now have fixed `search_path=public`.
- trigger-only functions are no longer directly executable by `anon` or `authenticated`; `service_role` remains allowed.
- `claim_next_marketing_task(text)` remains service-role only.
- authenticated execution of `is_conversation_participant(-1)` was verified inside a rolled-back transaction and returned `false`, confirming the RLS helper remains callable without changing data.
- no legacy data backfill, non-Saudi activation, or payment behavior change occurred.

Post-migration Security Advisor results:

- the targeted mutable-`search_path` warnings are cleared.
- the `expire_featured_talents()` public/authenticated SECURITY DEFINER warnings are cleared.
- `increment_talent_view(bigint)` remains intentionally open pending anti-abuse redesign.
- `is_conversation_participant(bigint)` still produces an authenticated SECURITY DEFINER warning by design because RLS currently requires authenticated execution.
- Supabase Auth leaked-password protection remains disabled and is a separate configuration task.

## Remaining P0/P1 decision

### `public.increment_talent_view(bigint)`

Current state:

- `SECURITY DEFINER`
- executable by `anon`, `authenticated`, and `service_role`
- increments a public counter without caller-specific anti-abuse protection

Do not blindly revoke until the public talent-view flow is traced end-to-end. Preferred next step is an anti-abuse redesign with least-privilege execution and rate/duplicate protection.

## RLS / Data API exposure findings

Audit snapshot:

- 60 public tables have RLS enabled with no policy.
- 51 of those still have at least one `anon` or `authenticated` table grant.
- 9 are effectively service-role-only because `anon` and `authenticated` have no table privileges.

Interpretation:

- `RLS enabled + no policy` is fail-closed for client roles; it is not automatically a data leak.
- the 9 service-role-only tables include the new market/payment foundation surfaces and are intentionally closed.
- the 51 older tables with broad client grants remain row-blocked by RLS, but their grants are wider than necessary. Reduce grants only after confirming whether client-side flows depend on direct Data API access.
- do not create permissive RLS policies merely to silence the advisor.

Verified service-role-only examples:

- `market_countries`
- `talent_work_markets`
- `entitlements`
- `payment_prices`
- `payment_products`
- `payments`
- `subscriptions`

## Performance findings

### Missing covering indexes

The performance advisor reports multiple foreign keys without covering indexes, including core paths such as:

- `opportunities.publisher_id`
- `opportunity_applications.talent_id`
- `messages.sender_user_id`
- `notifications.event_id`
- several support, payments, casting, and Marketing Hub relations

Recommended handling:

- add indexes in batches based on actual query paths and table growth
- prioritize high-traffic marketplace relations before low-volume admin/support relations
- avoid creating every suggested index blindly

### RLS init-plan warnings

Policies on `talents`, `profiles`, `publishers`, `messages`, `message_attachments`, `saved_opportunities`, `notification_preferences`, `notifications`, and `admin_users` re-evaluate `auth.*` functions per row.

Recommended target:

- replace direct `auth.uid()` / related calls with `(select auth.uid())` where semantically equivalent
- verify policy behavior before and after each change

### Multiple permissive policies

Advisor reports overlapping permissive SELECT policies on:

- `profiles`
- `talents`

Recommended target:

- reconcile duplicate/overlapping policies without weakening authorization
- do not merge policies until exact role/action semantics have been reviewed

### Unused indexes

Many indexes are reported unused. No index should be dropped solely because of the current advisor snapshot; the platform is young and some access paths have not accumulated enough usage yet.

## Next safe remediation sequence

1. Trace and redesign `increment_talent_view(bigint)` anti-abuse behavior.
2. Review Auth leaked-password protection and enable it as a separate configuration change when appropriate.
3. Review the 51 legacy broad client grants by actual application dependency; do not mass-revoke blindly.
4. Batch RLS init-plan rewrites with regression tests.
5. Prioritize missing covering indexes on core marketplace relations.
6. Reconcile duplicate permissive policies only after exact role/action semantics are verified.
7. Keep unused-index removal deferred until production evidence is sufficient.

## Current audit status

- Security advisors: REVIEWED + POST-MIGRATION RECHECKED
- Performance advisors: REVIEWED
- SECURITY DEFINER dependencies: REVIEWED
- Data API grants classification: REVIEWED
- Production P0/P1 hardening migration: APPLIED + VERIFIED
- Repository migration file: RECORDED ON HARDENING BRANCH
- Production deployment: NOT REQUIRED; no application code changed
- Next milestone: `increment_talent_view` anti-abuse design + Auth/grant hardening review
