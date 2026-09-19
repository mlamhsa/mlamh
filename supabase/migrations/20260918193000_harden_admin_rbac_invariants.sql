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
  p_new_role_key text,
  p_change_reason text default null
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
  v_actor_email text;
  v_actor_can_manage_admins boolean := false;
  v_actor_can_manage_roles boolean := false;
  v_target_email text;
  v_registry_role text;
  v_profile_type text;
  v_current_role text;
  v_current_role_count integer;
  v_selected_role_id bigint;
  v_super_admin_count integer;
  v_crosses_super_admin_boundary boolean;
  v_event_type text;
  v_action text;
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

  select
    au.email,
    coalesce(
      bool_or(permission.key = 'admins.manage'),
      false
    ),
    coalesce(
      bool_or(permission.key = 'roles.manage'),
      false
    )
  into
    v_actor_email,
    v_actor_can_manage_admins,
    v_actor_can_manage_roles
  from public.admin_users as au
  join public.profiles as profile
    on profile.user_id = au.id
    and profile.account_type = 'admin'
  join public.user_roles as actor_assignment
    on actor_assignment.user_id = au.id
  join public.roles as actor_role
    on actor_role.id = actor_assignment.role_id
    and actor_role.key in ('admin', 'super_admin')
  left join public.role_permissions as role_permission
    on role_permission.role_id = actor_role.id
  left join public.permissions as permission
    on permission.id = role_permission.permission_id
  where
    au.id = p_actor_user_id
    and au.role in ('admin', 'super_admin')
  group by au.email;

  if not found or not v_actor_can_manage_admins then
    raise exception using
      errcode = 'P0001',
      message = 'ADMIN_ACCESS_PERMISSION_DENIED';
  end if;

  if
    p_new_role_key <> 'revoked'
    and not v_actor_can_manage_roles
  then
    raise exception using
      errcode = 'P0001',
      message = 'ADMIN_ROLE_PERMISSION_DENIED';
  end if;

  select
    au.role,
    au.email
  into
    v_registry_role,
    v_target_email
  from public.admin_users as au
  where au.id = p_target_user_id
  for update;

  if not found then
    raise exception using
      errcode = 'P0001',
      message = 'ADMIN_ACCESS_TARGET_NOT_FOUND';
  end if;

  select profile.account_type
    into v_profile_type
  from public.profiles as profile
  where profile.user_id = p_target_user_id;

  if v_profile_type is distinct from 'admin' then
    raise exception using
      errcode = 'P0001',
      message = 'ADMIN_ACCESS_TARGET_NOT_ADMIN';
  end if;

  select
    count(*)::integer,
    min(role.key)
  into
    v_current_role_count,
    v_current_role
  from public.user_roles as assignment
  join public.roles as role
    on role.id = assignment.role_id
  where assignment.user_id = p_target_user_id;

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
    select role.id
      into v_selected_role_id
    from public.roles as role
    where role.key = p_new_role_key;

    if not found then
      raise exception using
        errcode = 'P0001',
        message = 'ADMIN_ACCESS_ROLE_NOT_FOUND';
    end if;
  end if;

  v_crosses_super_admin_boundary :=
    (v_current_role = 'super_admin')
    is distinct from
    (p_new_role_key = 'super_admin');

  if
    p_new_role_key = 'revoked'
    or v_crosses_super_admin_boundary
  then
    if
      p_change_reason is null
      or char_length(btrim(p_change_reason)) < 5
      or char_length(btrim(p_change_reason)) > 300
    then
      raise exception using
        errcode = 'P0001',
        message = 'ADMIN_ACCESS_REASON_REQUIRED';
    end if;
  end if;

  if
    v_current_role = 'super_admin'
    and p_new_role_key <> 'super_admin'
  then
    select count(distinct assignment.user_id)::integer
      into v_super_admin_count
    from public.user_roles as assignment
    join public.roles as role
      on role.id = assignment.role_id
      and role.key = 'super_admin'
    join public.admin_users as admin_registry
      on admin_registry.id = assignment.user_id
      and admin_registry.role in ('admin', 'super_admin')
    join public.profiles as profile
      on profile.user_id = assignment.user_id
      and profile.account_type = 'admin';

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

  if p_new_role_key = 'revoked' then
    v_event_type := 'admin_access_revoked';
    v_action := 'revoke_admin_access';
  else
    v_event_type := 'admin_role_changed';
    v_action := 'update_admin_role';
  end if;

  insert into public.events (
    event_type,
    target_type,
    target_id,
    actor_id,
    metadata
  )
  values (
    v_event_type,
    'admin',
    p_target_user_id::text,
    p_actor_user_id::text,
    jsonb_build_object(
      'action',
      v_action,
      'outcome',
      'success',
      'target_email',
      v_target_email,
      'previous_roles',
      case
        when v_current_role is null
          then '[]'::jsonb
        else jsonb_build_array(v_current_role)
      end,
      'new_role',
      case
        when p_new_role_key = 'revoked'
          then null
        else p_new_role_key
      end,
      'change_reason',
      nullif(btrim(p_change_reason), ''),
      'actor_email',
      v_actor_email,
      'atomic_access_mutation',
      true
    )
  );

  return query
  select
    v_current_role,
    p_new_role_key;
end;
$$;

revoke all
  on function public.set_admin_access_role(uuid, uuid, text, text)
  from public, anon, authenticated;

grant execute
  on function public.set_admin_access_role(uuid, uuid, text, text)
  to service_role;

