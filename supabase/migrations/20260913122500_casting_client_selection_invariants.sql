-- Casting client links are capability URLs. Keep each token globally unique.
create unique index if not exists casting_projects_client_access_token_unique_idx
  on public.casting_projects (client_access_token)
  where client_access_token is not null;

-- Enforce required_count atomically for client/admin selections. The application
-- performs a friendly pre-check, but concurrent requests must be serialized at
-- the database boundary so two selections cannot consume the final slot.
create or replace function public.enforce_casting_selected_capacity()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_required_count integer;
  v_selected_count integer;
begin
  if new.status <> 'selected' then
    return new;
  end if;

  if new.casting_role_id is not null then
    select cr.required_count
      into v_required_count
      from public.casting_roles cr
     where cr.id = new.casting_role_id
       and cr.casting_project_id = new.casting_project_id
     for update;

    if v_required_count is null then
      raise exception 'Casting role not found for shortlist selection.' using errcode = '23514';
    end if;

    select count(*)::integer
      into v_selected_count
      from public.casting_shortlist cs
     where cs.casting_project_id = new.casting_project_id
       and cs.casting_role_id = new.casting_role_id
       and cs.status = 'selected'
       and cs.id is distinct from new.id;
  else
    select cp.required_count
      into v_required_count
      from public.casting_projects cp
     where cp.id = new.casting_project_id
     for update;

    if v_required_count is null then
      raise exception 'Casting project not found for shortlist selection.' using errcode = '23514';
    end if;

    select count(*)::integer
      into v_selected_count
      from public.casting_shortlist cs
     where cs.casting_project_id = new.casting_project_id
       and cs.casting_role_id is null
       and cs.status = 'selected'
       and cs.id is distinct from new.id;
  end if;

  if v_selected_count >= greatest(coalesce(v_required_count, 1), 1) then
    raise exception 'Casting selection exceeds the required talent count.' using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists casting_shortlist_selected_capacity_guard on public.casting_shortlist;

create trigger casting_shortlist_selected_capacity_guard
before insert or update of status, casting_role_id, casting_project_id
on public.casting_shortlist
for each row
execute function public.enforce_casting_selected_capacity();
