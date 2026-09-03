# MLAMH Database Hardening Audit — 2026-09-03

## Scope

Security and performance review after the Multi-Country Foundation production milestone, followed by the explicitly approved minimal P0/P1 production hardening patches.

## Production baseline

- Project: `ozieysztwlispglupuox`
- Main baseline at audit start: `0dc46d9d7cd07a2fe14dad7b1b93e9b67f1e06a6`
- Multi-Country Foundation is already merged and deployed.
- Saudi Arabia remains the only active operational market.

## P0/P1 production hardening — VERIFIED

Applied production migrations:

- `20260903072241_harden_privileged_functions_p0_p1`
- `20260903074118_harden_increment_talent_view_rpc`

Verified outcomes:

- `public.expire_featured_talents()` is no longer executable by `anon` or `authenticated`; `service_role` remains allowed.
- `public.is_conversation_participant(bigint)` is no longer executable by `anon`; `authenticated` remains allowed because message, attachment, and storage RLS policies depend on it.
- `public.set_contact_requests_updated_at()`, `public.set_updated_at()`, `public.claim_next_marketing_task(text)`, and `public.sync_marketing_agent_from_task()` have fixed `search_path=public`.
- trigger-only functions are no longer directly executable by `anon` or `authenticated`; `service_role` remains allowed.
- `claim_next_marketing_task(text)` remains service-role only.
- `public.increment_talent_view(bigint)` is now `SECURITY INVOKER`, keeps `search_path=public`, is not executable by `PUBLIC`, `anon`, or `authenticated`, and remains executable by `service_role` only.
- the current talent profile page calls the view counter through `createAdminClient()`, which uses `SUPABASE_SERVICE_ROLE_KEY`, so the public talent-view flow remains compatible with the new execution boundary.
- a production verification transaction confirmed `service_role` can increment a real talent counter (`37 → 38`), and the forced rollback restored the stored value to `37`, leaving no test view behind.
- authenticated execution of `is_conversation_participant(-1)` was previously verified inside a rolled-back transaction and returned `false`, confirming the RLS helper remains callable without changing data.
- no legacy data backfill, non-Saudi activation, or payment behavior change occurred.

Post-migration Security Advisor results:

- the targeted mutable-`search_path` warnings are cleared.
- the `expire_featured_talents()` public/authenticated SECURITY DEFINER warnings are cleared.
- the `increment_talent_view(bigint)` SECURITY DEFINER/client-execution warning is cleared.
- `is_conversation_participant(bigint)` still produces an authenticated SECURITY DEFINER warning by design because RLS currently requires authenticated execution.
- Supabase Auth leaked-password protection remains disabled and is a separate configuration task.

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

1. Review Supabase Auth leaked-password protection and enable it as a separate configuration change when appropriate.
2. Review the 51 legacy broad client grants by actual application dependency; do not mass-revoke blindly.
3. Batch RLS init-plan rewrites with regression tests.
4. Prioritize missing covering indexes on core marketplace relations.
5. Reconcile duplicate permissive policies only after exact role/action semantics are verified.
6. Keep unused-index removal deferred until production evidence is sufficient.

## Current audit status

- Security advisors: REVIEWED + POST-MIGRATION RECHECKED
- Performance advisors: REVIEWED
- SECURITY DEFINER dependencies: REVIEWED
- `increment_talent_view` runtime path: TRACED + HARDENED + VERIFIED
- Data API grants classification: REVIEWED
- Production P0/P1 hardening migrations: APPLIED + VERIFIED
- Repository migration files: RECORDED ON HARDENING BRANCH
- Production deployment: NOT REQUIRED; no application code changed
- Next milestone: Auth leaked-password protection + legacy grant/RLS performance review
