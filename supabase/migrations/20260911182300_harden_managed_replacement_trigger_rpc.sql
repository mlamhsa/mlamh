-- Trigger helpers are server-internal and must never be callable through the public RPC surface.
revoke execute on function public.sync_managed_casting_replacement_status() from public, anon, authenticated;
revoke execute on function public.prevent_managed_shortlist_change_after_booking() from public, anon, authenticated;
grant execute on function public.sync_managed_casting_replacement_status() to service_role;
grant execute on function public.prevent_managed_shortlist_change_after_booking() to service_role;
