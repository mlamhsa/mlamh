-- Model Specializations V1: add an opt-in restricted profile visibility mode.
-- This migration is additive only: it does not update any existing talent row.
-- Existing 'public' and 'private' values remain valid and unchanged.

alter table if exists public.talents
  drop constraint if exists talents_profile_visibility_check;

alter table if exists public.talents
  add constraint talents_profile_visibility_check
  check (profile_visibility in ('public', 'verified_publishers', 'private'));

comment on column public.talents.profile_visibility is
  'public = eligible for the public directory after approval; verified_publishers = hidden from public discovery and available only through authorized publisher workflows; private = never public and available only for private matching/workflows.';
