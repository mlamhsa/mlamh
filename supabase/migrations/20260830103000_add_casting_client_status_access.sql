alter table public.casting_projects
  add column if not exists client_access_token text,
  add column if not exists client_status_note text,
  add column if not exists client_shared_at timestamptz;

create unique index if not exists casting_projects_client_access_token_key
  on public.casting_projects(client_access_token)
  where client_access_token is not null;

comment on column public.casting_projects.client_access_token is
  'Secret token for read-only client casting status view.';

comment on column public.casting_projects.client_status_note is
  'Client-safe status update managed by MLAMH admin.';
