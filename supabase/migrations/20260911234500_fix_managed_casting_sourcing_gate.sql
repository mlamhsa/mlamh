-- Enforce the Managed Casting sourcing/payment gate for every managed project,
-- including paid projects that do not have a launch_offer_identity.
--
-- Previous behavior returned early when launch_offer_identity was NULL, which
-- meant paid Basic/Pro/Enterprise projects could insert targeted invitations
-- before their required activation payment milestone was verified.
--
-- The trigger now protects both fresh inserts and resend/upsert flows that set
-- an invitation back to `sent`, while still allowing later viewed/applied
-- transitions even if the commercial state changes after the invitation was sent.

create or replace function public.enforce_managed_casting_sourcing_gate()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_is_managed boolean;
  v_allowed boolean;
begin
  -- Only the act of sending/re-sending an invitation is a sourcing event.
  if new.status is distinct from 'sent' then
    return new;
  end if;

  select exists (
    select 1
    from public.casting_projects cp
    where cp.id = new.casting_project_id
      and cp.service_mode = 'managed'
  ) into v_is_managed;

  if not coalesce(v_is_managed, false) then
    return new;
  end if;

  select public.managed_casting_can_source(new.casting_project_id)
    into v_allowed;

  if coalesce(v_allowed, false) is not true then
    raise exception 'Managed Casting payment activation is required before sourcing invitations can be sent.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_managed_casting_sourcing_gate on public.managed_casting_invitations;
create trigger trg_managed_casting_sourcing_gate
before insert or update of casting_project_id, status
on public.managed_casting_invitations
for each row
execute function public.enforce_managed_casting_sourcing_gate();

comment on function public.enforce_managed_casting_sourcing_gate() is
  'Blocks Managed Casting targeted invitation send/resend until the project activation payment gate is satisfied; launch-free projects remain eligible via managed_casting_can_source().';
