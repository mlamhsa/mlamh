-- MLAMH Security Hardening V1: immediate guardrails

-- 1) Block direct client access to the sensitive admin aggregation view.
-- The view currently contains PII such as phone/date-of-birth/account metadata.
-- Server-side service-role access remains available.
revoke all on table public.admin_talent_profiles from anon, authenticated;
grant select on table public.admin_talent_profiles to service_role;

-- 2) Pin trigger-function search_path to prevent object-shadowing/search-path attacks.
alter function public.prevent_profile_account_type_change()
  set search_path = pg_catalog, public;

-- 3) Create an isolated private quarantine bucket for the secure media pipeline.
-- Nothing is published from this bucket directly.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media-quarantine',
  'media-quarantine',
  false,
  12582912,
  array['image/jpeg','image/png','image/webp']::text[]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
