alter table public.talent_bookings alter column publisher_id drop not null;

alter table public.talent_bookings
  add column if not exists admin_user_id uuid references auth.users(id) on delete set null,
  add column if not exists managed_casting_project_id bigint references public.casting_projects(id) on delete set null;

alter table public.talent_bookings drop constraint if exists talent_bookings_participant_type_check;
alter table public.talent_bookings
  add constraint talent_bookings_participant_type_check check (
    (publisher_id is not null and admin_user_id is null)
    or
    (publisher_id is null and admin_user_id is not null and managed_casting_project_id is not null)
  );

create index if not exists idx_talent_bookings_managed_project
  on public.talent_bookings(managed_casting_project_id)
  where managed_casting_project_id is not null;
