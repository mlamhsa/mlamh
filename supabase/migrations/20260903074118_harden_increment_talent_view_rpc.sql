-- MLAMH increment_talent_view RPC hardening — applied to production 2026-09-03.
-- Scope: restrict execution to trusted server service_role and remove SECURITY DEFINER.
-- No data backfill, market activation, or payment behavior changes.

alter function public.increment_talent_view(bigint)
  security invoker;

alter function public.increment_talent_view(bigint)
  set search_path = public;

revoke execute on function public.increment_talent_view(bigint) from public;
revoke execute on function public.increment_talent_view(bigint) from anon;
revoke execute on function public.increment_talent_view(bigint) from authenticated;
grant execute on function public.increment_talent_view(bigint) to service_role;
