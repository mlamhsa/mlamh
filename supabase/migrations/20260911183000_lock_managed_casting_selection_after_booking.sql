create or replace function public.prevent_managed_shortlist_change_after_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
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

drop trigger if exists trg_lock_managed_shortlist_after_booking on public.casting_shortlist;
create trigger trg_lock_managed_shortlist_after_booking
before update of status on public.casting_shortlist
for each row execute function public.prevent_managed_shortlist_change_after_booking();
