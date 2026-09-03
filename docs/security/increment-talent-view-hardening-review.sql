-- MLAMH increment_talent_view hardening — REVIEW DRAFT ONLY
-- Date: 2026-09-03
--
-- Current runtime contract verified:
--   app/[locale]/talent/[slug]/page.tsx calls this RPC through createAdminClient().
--   createAdminClient() uses SUPABASE_SERVICE_ROLE_KEY.
--   service_role has SELECT/INSERT/UPDATE privileges on public.talent_views.
--
-- Therefore browser roles do not need direct EXECUTE on this RPC.
-- This draft intentionally keeps the counting behavior unchanged while
-- removing unnecessary SECURITY DEFINER/client exposure.

alter function public.increment_talent_view(bigint)
  security invoker;

alter function public.increment_talent_view(bigint)
  set search_path = public;

revoke execute on function public.increment_talent_view(bigint) from public;
revoke execute on function public.increment_talent_view(bigint) from anon;
revoke execute on function public.increment_talent_view(bigint) from authenticated;
grant execute on function public.increment_talent_view(bigint) to service_role;

-- Required production verification after application:
-- 1. Re-check pg_proc privileges and proconfig.
-- 2. Re-run Supabase security advisors; SECDEF client warnings should disappear.
-- 3. Open one known public talent profile and verify its talent_views counter
--    increases exactly once for the server render.
-- 4. Verify anon/authenticated cannot invoke /rest/v1/rpc/increment_talent_view.
-- 5. Verify no change to public talent visibility, payments, market activation,
--    or legacy data.
