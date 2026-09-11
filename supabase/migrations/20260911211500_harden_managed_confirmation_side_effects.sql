-- Prevent Managed Casting confirmation side effects from occurring before the
-- project's commercial/payment gate is satisfied. Booking writes are already
-- gated separately; this closes the earlier application/conversation mutations
-- performed by the admin confirmation workflow.

create or replace function public.enforce_managed_confirmation_application_gate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project_id bigint;
begin
  if new.status is not distinct from old.status or new.status <> 'accepted' then
    return new;
  end if;

  select cp.id
    into v_project_id
    from public.casting_shortlist cs
    join public.casting_projects cp on cp.id = cs.casting_project_id
   where cs.application_id = new.id
     and cp.service_mode = 'managed'
     and cs.status in ('selected', 'accepted')
   order by cp.id desc
   limit 1;

  if v_project_id is not null
     and not public.managed_casting_can_confirm_talent(v_project_id) then
    raise exception 'Managed casting payment milestone must be verified before talent confirmation.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists managed_confirmation_application_gate on public.opportunity_applications;
create trigger managed_confirmation_application_gate
before update of status on public.opportunity_applications
for each row
execute function public.enforce_managed_confirmation_application_gate();

create or replace function public.enforce_managed_confirmation_conversation_gate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project_id bigint;
begin
  if new.conversation_type <> 'mlamh_talent' or new.application_id is null then
    return new;
  end if;

  select cp.id
    into v_project_id
    from public.casting_shortlist cs
    join public.casting_projects cp on cp.id = cs.casting_project_id
   where cs.application_id = new.application_id
     and cp.service_mode = 'managed'
     and cs.status in ('selected', 'accepted')
   order by cp.id desc
   limit 1;

  if v_project_id is not null
     and not public.managed_casting_can_confirm_talent(v_project_id) then
    raise exception 'Managed casting payment milestone must be verified before MLAMH talent contact.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists managed_confirmation_conversation_gate on public.conversations;
create trigger managed_confirmation_conversation_gate
before insert or update of application_id, conversation_type, admin_user_id, status on public.conversations
for each row
execute function public.enforce_managed_confirmation_conversation_gate();

comment on function public.enforce_managed_confirmation_application_gate() is
  'Blocks accepting a selected Managed Casting application until the required payment milestone is verified.';
comment on function public.enforce_managed_confirmation_conversation_gate() is
  'Blocks Managed Casting MLAMH↔talent conversation creation/mutation until the required confirmation payment milestone is verified.';
