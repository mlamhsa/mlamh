-- MLAMH Security Hardening V1
-- Trigger-only functions must not be callable directly through PostgREST RPC.

do $$
begin
  if to_regprocedure('public.prevent_managed_shortlist_change_after_booking()') is not null then
    revoke execute on function public.prevent_managed_shortlist_change_after_booking() from public, anon, authenticated;
  end if;
end
$$;
