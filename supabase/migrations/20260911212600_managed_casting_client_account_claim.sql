alter table public.casting_projects
  add column if not exists client_user_id uuid null references auth.users(id) on delete set null;

create index if not exists idx_casting_projects_client_user_id
  on public.casting_projects(client_user_id)
  where client_user_id is not null;

comment on column public.casting_projects.client_user_id is 'Optional authenticated owner for a managed-casting client workspace. Guest token access remains supported.';
