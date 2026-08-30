alter table public.opportunities
  add column if not exists managed_by_mlamh boolean not null default false;

create index if not exists opportunities_managed_by_mlamh_idx
  on public.opportunities(managed_by_mlamh)
  where managed_by_mlamh = true;

comment on column public.opportunities.managed_by_mlamh is
  'True when MLAMH manages the casting workflow for the client; the client remains the project owner.';
