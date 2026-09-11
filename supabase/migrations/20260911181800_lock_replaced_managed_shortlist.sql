-- A replacement guarantee decision is operational history and must not be
-- re-opened by the client after the old booking has been cancelled.
create or replace function public.prevent_managed_shortlist_change_after_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'replaced' and new.status is distinct from old.status then
    raise exception 'A replaced managed casting selection cannot be changed.';
  end if;

  if new.status is distinct from old.status and exists (
    select 1
    from public.talent_bookings tb
    where tb.application_id = old.application_id
      and tb.managed_casting_project_id = old.casting_project_id
      and tb.status <> 'cancelled'
  ) then
    raise exception 'Managed casting selection is locked after talent confirmation starts.';
  end if;
  return new;
end;
$$;

revoke all on function public.prevent_managed_shortlist_change_after_booking() from public;
grant execute on function public.prevent_managed_shortlist_change_after_booking() to service_role;
