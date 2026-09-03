-- MLAMH privileged function hardening — applied to production 2026-09-03.
-- Scope: P0/P1 only. No data backfill, market activation, or payment behavior changes.

-- Internal maintenance function: service-role only.
revoke execute on function public.expire_featured_talents() from public;
revoke execute on function public.expire_featured_talents() from anon;
revoke execute on function public.expire_featured_talents() from authenticated;
grant execute on function public.expire_featured_talents() to service_role;

-- RLS helper: authenticated execution is required by message and attachment policies.
revoke execute on function public.is_conversation_participant(bigint) from public;
revoke execute on function public.is_conversation_participant(bigint) from anon;
grant execute on function public.is_conversation_participant(bigint) to authenticated;
grant execute on function public.is_conversation_participant(bigint) to service_role;

-- Fix mutable search_path on existing functions.
alter function public.set_contact_requests_updated_at()
  set search_path = public;

alter function public.set_updated_at()
  set search_path = public;

alter function public.claim_next_marketing_task(text)
  set search_path = public;

alter function public.sync_marketing_agent_from_task()
  set search_path = public;

-- Trigger helpers should not be public RPCs.
revoke execute on function public.set_contact_requests_updated_at() from public;
revoke execute on function public.set_contact_requests_updated_at() from anon;
revoke execute on function public.set_contact_requests_updated_at() from authenticated;
grant execute on function public.set_contact_requests_updated_at() to service_role;

revoke execute on function public.set_updated_at() from public;
revoke execute on function public.set_updated_at() from anon;
revoke execute on function public.set_updated_at() from authenticated;
grant execute on function public.set_updated_at() to service_role;

revoke execute on function public.sync_marketing_agent_from_task() from public;
revoke execute on function public.sync_marketing_agent_from_task() from anon;
revoke execute on function public.sync_marketing_agent_from_task() from authenticated;
grant execute on function public.sync_marketing_agent_from_task() to service_role;

-- Preserve existing service-role-only task claim boundary.
revoke execute on function public.claim_next_marketing_task(text) from public;
revoke execute on function public.claim_next_marketing_task(text) from anon;
revoke execute on function public.claim_next_marketing_task(text) from authenticated;
grant execute on function public.claim_next_marketing_task(text) to service_role;

-- Intentionally deferred:
-- - increment_talent_view(bigint) anti-abuse redesign
-- - broad legacy client grant cleanup
-- - RLS performance rewrites
-- - covering-index batches
-- - leaked-password protection (Auth configuration)
