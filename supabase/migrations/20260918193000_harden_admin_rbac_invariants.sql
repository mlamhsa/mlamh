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
