# MLAMH Database Hardening Audit — 2026-09-03

## Scope

Read-only security and performance review after the Multi-Country Foundation production milestone.

No production DDL or DML is authorized or executed by this audit.

## Production baseline

- Project: `ozieysztwlispglupuox`
- Main baseline: `0dc46d9d7cd07a2fe14dad7b1b93e9b67f1e06a6`
- Multi-Country Foundation is already merged and deployed.
- Saudi Arabia remains the only active operational market.

## Priority model

### P0 — Security boundary

1. `public.expire_featured_talents()`
   - `SECURITY DEFINER`
   - currently executable by `anon`, `authenticated`, and `service_role`
   - no application-code reference found on the default branch
   - no active `pg_cron` job references it
   - recommended target: revoke `PUBLIC`, `anon`, and `authenticated`; grant only to trusted server/admin execution path if still required

2. `public.is_conversation_participant(bigint)`
   - `SECURITY DEFINER`
   - currently executable by `anon`, `authenticated`, and `service_role`
   - required by RLS policies on `messages`, `message_attachments`, and `storage.objects`
   - recommended target: keep `authenticated` execution because RLS depends on it; revoke `anon` and `PUBLIC`; keep explicit `service_role` only if required
   - preserve the current authorization predicate and verify message read/insert + attachment read/upload/delete after any privilege change

3. `public.increment_talent_view(bigint)`
   - `SECURITY DEFINER`
   - currently executable by `anon`, `authenticated`, and `service_role`
   - no application-code reference found on the default branch
   - increments a public counter with no caller-specific anti-abuse guard
   - recommended target: do not blindly revoke until the public talent-view flow is traced end-to-end; if retained as public RPC, redesign with rate/duplicate-abuse protection and least-privilege execution

## P1 — Function hardening

Supabase advisor reports mutable `search_path` on:

- `public.set_contact_requests_updated_at()`
- `public.set_updated_at()`
- `public.claim_next_marketing_task(text)`
- `public.sync_marketing_agent_from_task()`

Recommended target:

- set a fixed `search_path` for each function
- schema-qualify referenced relations
- keep trigger functions non-publicly executable where direct RPC execution is unnecessary
- preserve `claim_next_marketing_task(text)` as service-role only; current grants already show `anon=false`, `authenticated=false`, `service_role=true`

## P1 — Auth hardening

Supabase Auth leaked-password protection is currently disabled.

Recommended target:

- enable leaked-password protection in Auth settings
- verify current password policy and recovery flow after enabling

This is a configuration change and should be handled separately from SQL migrations.

## RLS / Data API exposure findings

Current advisor count:

- 60 public tables have RLS enabled with no policy
- 51 of those still have at least one `anon` or `authenticated` table grant
- 9 are effectively service-role-only because `anon` and `authenticated` have no table privileges

Important interpretation:

- `RLS enabled + no policy` is fail-closed for client roles; it is not automatically a data leak.
- The 9 service-role-only tables include the new market/payment foundation surfaces and are intentionally closed.
- The 51 older tables with broad client grants remain row-blocked by RLS, but their grants are wider than necessary. Reduce grants only after confirming whether any client-side flows depend on direct Data API access.
- Do not create permissive RLS policies merely to silence the advisor.

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

## Safe remediation sequence

1. Trace all RPC usage and policy dependencies.
2. Prepare a dedicated hardening migration, but do not apply it to production without explicit approval.
3. P0 first:
   - restrict `expire_featured_talents`
   - restrict `is_conversation_participant` to the roles actually required by RLS
   - decide the intended public contract for `increment_talent_view`
4. P1 functions:
   - immutable/fixed search paths
   - explicit function grants
5. Re-run Supabase security advisors.
6. Run regression tests covering messaging, attachments, public talent pages, admin operations, and Marketing Hub task claiming.
7. Only then address grant cleanup, RLS performance, and missing indexes in separate reviewable batches.
8. Keep index removal deferred until there is enough production evidence.

## Production gates

Before any production hardening DDL:

- explicit user approval is required
- migration must be reviewed against the current production schema and migration ledger
- no unrelated feature change
- no non-Saudi market activation
- no payment behavior change
- no legacy data backfill

## Current audit status

- Security advisors: REVIEWED
- Performance advisors: REVIEWED
- SECURITY DEFINER dependencies: REVIEWED
- Data API grants sample + no-policy classification: REVIEWED
- Production mutation: NOT PERFORMED
- Hardening migration: NOT YET CREATED
- Next milestone: prepare and review the minimal P0/P1 hardening patch before requesting production DDL approval
