-- Keep replacement audit status synchronized with the replacement booking.
create or replace function public.sync_managed_casting_replacement_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'confirmed' then
      update public.managed_casting_replacements
      set status = 'replacement_confirmed', updated_at = now()
      where replacement_booking_id = new.id
        and status in ('replacement_started','replacement_confirming');
    elsif new.status = 'cancelled' then
      update public.managed_casting_replacements
      set status = 'replacement_failed', updated_at = now()
      where replacement_booking_id = new.id
        and status <> 'replacement_failed';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.sync_managed_casting_replacement_status() from public;
grant execute on function public.sync_managed_casting_replacement_status() to service_role;

drop trigger if exists trg_sync_managed_casting_replacement_status on public.talent_bookings;
create trigger trg_sync_managed_casting_replacement_status
after update of status on public.talent_bookings
for each row
when (new.managed_casting_project_id is not null)
execute function public.sync_managed_casting_replacement_status();
