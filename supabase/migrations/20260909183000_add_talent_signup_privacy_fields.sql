-- Talent Flow V1: persist profile visibility and consent choices.
-- Public/private affects only public discovery; both states may remain approved and eligible for private matching.

alter table if exists public.talents
  add column if not exists profile_visibility text not null default 'public';

alter table if exists public.talents
  drop constraint if exists talents_profile_visibility_check;

alter table if exists public.talents
  add constraint talents_profile_visibility_check
  check (profile_visibility in ('public', 'private'));

alter table if exists public.profiles
  add column if not exists data_accuracy_contact_consent boolean not null default false,
  add column if not exists data_accuracy_contact_consent_at timestamptz;

comment on column public.talents.profile_visibility is
  'public = eligible for public directory only after approval; private = never public, available only for private matching/workflows.';

comment on column public.profiles.data_accuracy_contact_consent is
  'Talent confirms submitted information is accurate and permits MLAMH to store data and contact them about relevant opportunities/projects.';
