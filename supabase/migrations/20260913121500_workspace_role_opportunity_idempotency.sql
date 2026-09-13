-- Prevent duplicate opportunity creation for the same Casting Workspace role.
-- The workspace publisher flow persists workspace_role_id inside role_requirements.
-- A partial unique expression index makes publication idempotent at the database
-- boundary, including concurrent/double-submit requests.

create unique index if not exists opportunities_workspace_role_id_unique_idx
  on public.opportunities ((role_requirements ->> 'workspace_role_id'))
  where role_requirements ? 'workspace_role_id'
    and nullif(role_requirements ->> 'workspace_role_id', '') is not null;
