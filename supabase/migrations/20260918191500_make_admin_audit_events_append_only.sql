-- Make security-sensitive admin audit events append-only at the database layer.
-- Inserts remain allowed. Runtime UPDATE/DELETE attempts against admin_* events fail closed.
-- A future privileged migration can intentionally replace or drop this trigger if retention
-- requirements change; normal application/service-role traffic cannot mutate these rows.

create or replace function public.prevent_admin_audit_event_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    if old.event_type like 'admin\_%' escape '\\' then
      raise exception
        'admin audit events are append-only'
        using errcode = '42501';
    end if;

    return old;
  end if;

  if
    old.event_type like 'admin\_%' escape '\\'
    or new.event_type like 'admin\_%' escape '\\'
  then
    raise exception
      'admin audit events are append-only'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all
  on function public.prevent_admin_audit_event_mutation()
  from public, anon, authenticated, service_role;

drop trigger if exists prevent_admin_audit_event_mutation
  on public.events;

create trigger prevent_admin_audit_event_mutation
before update or delete
on public.events
for each row
execute function public.prevent_admin_audit_event_mutation();
