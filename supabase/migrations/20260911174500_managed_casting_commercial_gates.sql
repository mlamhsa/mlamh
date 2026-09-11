create or replace function public.enforce_managed_casting_sourcing_gate()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_identity text;
  v_allowed boolean;
begin
  select launch_offer_identity into v_identity
  from public.casting_projects
  where id = new.casting_project_id and service_mode = 'managed';

  if v_identity is null then return new; end if;

  select public.managed_casting_can_source(new.casting_project_id) into v_allowed;
  if coalesce(v_allowed, false) is not true then
    raise exception 'Managed Casting payment activation is required before sourcing invitations can be sent.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_managed_casting_sourcing_gate on public.managed_casting_invitations;
create trigger trg_managed_casting_sourcing_gate
before insert on public.managed_casting_invitations
for each row execute function public.enforce_managed_casting_sourcing_gate();

create or replace function public.enforce_managed_casting_booking_gate()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_identity text;
  v_allowed boolean;
begin
  if new.managed_casting_project_id is null then return new; end if;

  select launch_offer_identity into v_identity
  from public.casting_projects
  where id = new.managed_casting_project_id and service_mode = 'managed';

  if v_identity is null then return new; end if;

  select public.managed_casting_can_confirm_talent(new.managed_casting_project_id) into v_allowed;
  if coalesce(v_allowed, false) is not true then
    raise exception 'Managed Casting payment milestone is required before talent confirmation and booking.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_managed_casting_booking_gate on public.talent_bookings;
create trigger trg_managed_casting_booking_gate
before insert or update of managed_casting_project_id, status on public.talent_bookings
for each row
when (new.managed_casting_project_id is not null and new.status in ('proposed','changes_requested','confirmed'))
execute function public.enforce_managed_casting_booking_gate();
