-- Multi-country foundation for MLAMH.
-- Additive only. This migration does not activate any non-Saudi market and does not backfill legacy rows.

create table if not exists public.market_countries (
  country_code text primary key,
  name_ar text not null,
  name_en text not null,
  default_currency text not null,
  market_status text not null default 'future'
    check (market_status in ('active', 'prepared', 'future')),
  talent_registration_enabled boolean not null default false,
  publisher_registration_enabled boolean not null default false,
  opportunity_creation_enabled boolean not null default false,
  applications_enabled boolean not null default false,
  public_talent_directory_enabled boolean not null default false,
  public_opportunities_enabled boolean not null default false,
  search_enabled boolean not null default false,
  payments_enabled boolean not null default false,
  seo_indexing_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.market_countries is
  'Country/market capability registry. Country presence does not imply market activation.';

alter table public.market_countries enable row level security;

-- No anon/authenticated policies are intentionally created here. Market configuration
-- remains server/admin controlled until an explicit read surface is approved.
revoke all on table public.market_countries from anon, authenticated;

alter table public.talents
  add column if not exists base_country_code text null;

alter table public.publishers
  add column if not exists country_code text null;

alter table public.opportunities
  add column if not exists country_code text null,
  add column if not exists currency text null;

alter table public.casting_projects
  add column if not exists country_code text null;

alter table public.marketing_briefs
  add column if not exists country_code text null;

alter table public.marketing_leads
  add column if not exists country_code text null;

create table if not exists public.talent_work_markets (
  talent_id uuid not null references public.talents(id) on delete cascade,
  country_code text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (talent_id, country_code)
);

comment on table public.talent_work_markets is
  'Markets where a talent is willing/eligible to accept opportunities; separate from nationality and base location.';

alter table public.talent_work_markets enable row level security;
revoke all on table public.talent_work_markets from anon, authenticated;

-- Keep new country fields nullable during the compatibility window. Legacy rows continue
-- to behave as Saudi data in application logic until a separately approved backfill.

create index if not exists idx_talents_base_country_code
  on public.talents(base_country_code);
create index if not exists idx_publishers_country_code
  on public.publishers(country_code);
create index if not exists idx_opportunities_country_code
  on public.opportunities(country_code);
create index if not exists idx_casting_projects_country_code
  on public.casting_projects(country_code);
create index if not exists idx_marketing_briefs_country_code
  on public.marketing_briefs(country_code);
create index if not exists idx_marketing_leads_country_code
  on public.marketing_leads(country_code);
create index if not exists idx_talent_work_markets_country_enabled
  on public.talent_work_markets(country_code, enabled)
  where enabled = true;
