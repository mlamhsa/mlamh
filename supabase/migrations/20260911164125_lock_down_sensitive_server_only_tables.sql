-- Security Hardening V1
-- Keep sensitive authorization and marketing event tables server-only.
-- Application access to these tables goes through trusted server code using
-- the Supabase service role; anon/authenticated clients must not access them
-- directly through PostgREST.

alter table public.marketing_events enable row level security;
alter table public.user_roles enable row level security;
alter table public.roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.permissions enable row level security;

-- RLS does not govern every table privilege (for example TRUNCATE), so remove
-- all direct table privileges from browser-facing Postgres roles as defense in depth.
revoke all privileges on table public.marketing_events from anon, authenticated;
revoke all privileges on table public.user_roles from anon, authenticated;
revoke all privileges on table public.roles from anon, authenticated;
revoke all privileges on table public.role_permissions from anon, authenticated;
revoke all privileges on table public.permissions from anon, authenticated;
