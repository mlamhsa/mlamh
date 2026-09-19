-- Harden administrator RBAC invariants at the database layer.
-- Current production data was verified read-only before this migration was added:
-- - admin_users.role currently uses only supported registry values.
-- - user_roles currently has no user with more than one assigned role.
--
-- The application already fails closed when these invariants are violated.
-- These constraints prevent new inconsistent states from being created.

alter table public.admin_users
  drop constraint if exists admin_users_role_allowed_check;

alter table public.admin_users
  add constraint admin_users_role_allowed_check
  check (
    role in (
      'admin',
      'super_admin',
      'revoked'
    )
  )
  not valid;

alter table public.admin_users
  validate constraint admin_users_role_allowed_check;

create unique index if not exists user_roles_single_role_per_user_idx
  on public.user_roles (user_id);

-- Keep admin role transitions atomic. The function is service-role only and
-- serializes access mutations inside PostgreSQL so the final Super Admin
-- invariant is checked in the same transaction that performs the change.
create or replace function public.set_admin_access_role(
  p_actor_user_id uuid,
  p_target_user_id uuid,
  p_new_role_key text
)
returns table (
  previous_role text,
  new_role text
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_registry_role text;
  v_profile_type text;
  v_current_role text;
  v_current_role_count integer;
  v_selected_role_id bigint;
  v_super_admin_count integer;
begin
  if p_actor_user_id is null or p_target_user_id is null then
    raise exception using
      errcode = 'P0001',
      message = 'ADMIN_ACCESS_INVALID_USER';
  end if;

  if p_actor_user_id = p_target_user_id then
    raise exception using
      errcode = 'P0001',
      message = 'SELF_ADMIN_ACCESS_CHANGE';
  end if;

  if p_new_role_key not in ('admin', 'super_admin', 'revoked') then
    raise exception using
      errcode = 'P0001',
      message = 'ADMIN_ACCESS_INVALID_ROLE';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'mlamh_admin_access_mutation',
      0
    )
  );

  select au.role
    into v_registry_role
  from public.admin_users as au
  where au.id = p_target_user_id
  for update;

  if not found then
    raise exception using
      errcode = 'P0001',
      message = 'ADMIN_ACCESS_TARGET_NOT_FOUND';
  end if;

  select p.account_type
    into v_profile_type
  from public.profiles as p
  where p.user_id = p_target_user_id;

  if v_profile_type is distinct from 'admin' then
    raise exception using
      errcode = 'P0001',
      message = 'ADMIN_ACCESS_TARGET_NOT_ADMIN';
  end if;

  select
    count(*)::integer,
    min(r.key)
  into
    v_current_role_count,
    v_current_role
  from public.user_roles as ur
  join public.roles as r
    on r.id = ur.role_id
  where ur.user_id = p_target_user_id;

  if v_registry_role in ('admin', 'super_admin') then
    if
      v_current_role_count <> 1
      or v_current_role not in ('admin', 'super_admin')
    then
      raise exception using
        errcode = 'P0001',
        message = 'ADMIN_ACCESS_INCONSISTENT';
    end if;
  elsif v_registry_role = 'revoked' then
    if v_current_role_count <> 0 then
      raise exception using
        errcode = 'P0001',
        message = 'ADMIN_ACCESS_INCONSISTENT';
    end if;

    v_current_role := null;
  else
    raise exception using
      errcode = 'P0001',
      message = 'ADMIN_ACCESS_INCONSISTENT';
  end if;

  if p_new_role_key <> 'revoked' then
    select r.id
      into v_selected_role_id
    from public.roles as r
    where r.key = p_new_role_key;

    if not found then
      raise exception using
        errcode = 'P0001',
        message = 'ADMIN_ACCESS_ROLE_NOT_FOUND';
    end if;
  end if;

  if
    v_current_role = 'super_admin'
    and p_new_role_key <> 'super_admin'
  then
    select count(distinct ur.user_id)::integer
      into v_super_admin_count
    from public.user_roles as ur
    join public.roles as r
      on r.id = ur.role_id
      and r.key = 'super_admin'
    join public.admin_users as au
      on au.id = ur.user_id
      and au.role in ('admin', 'super_admin')
    join public.profiles as p
      on p.user_id = ur.user_id
      and p.account_type = 'admin';

    if v_super_admin_count <= 1 then
      raise exception using
        errcode = 'P0001',
        message = 'LAST_SUPER_ADMIN';
    end if;
  end if;

  delete from public.user_roles
  where user_id = p_target_user_id;

  if p_new_role_key <> 'revoked' then
    insert into public.user_roles (
      user_id,
      role_id
    )
    values (
      p_target_user_id,
      v_selected_role_id
    );
  end if;

  update public.admin_users
  set role = p_new_role_key
  where id = p_target_user_id;

  return query
  select
    v_current_role,
    p_new_role_key;
end;
$$;

revoke all
  on function public.set_admin_access_role(uuid, uuid, text)
  from public, anon, authenticated;

grant execute
  on function public.set_admin_access_role(uuid, uuid, text)
  to service_role;

