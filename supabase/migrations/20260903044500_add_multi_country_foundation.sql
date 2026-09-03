-- Multi-country foundation for MLAMH.
-- Additive only. This migration does not activate any non-Saudi market and does not backfill legacy rows.

create table if not exists public.market_countries (
  country_code text primary key
    check (country_code ~ '^[A-Z]{2}$'),
  name_ar text not null,
  name_en text not null,
  default_currency text not null
    check (default_currency ~ '^[A-Z]{3}$'),
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

insert into public.market_countries (
  country_code, name_ar, name_en, default_currency, market_status,
  talent_registration_enabled, publisher_registration_enabled,
  opportunity_creation_enabled, applications_enabled,
  public_talent_directory_enabled, public_opportunities_enabled,
  search_enabled, payments_enabled, seo_indexing_enabled
) values
  ('SA','السعودية','Saudi Arabia','SAR','active',true,true,true,true,true,true,true,true,true),
  ('AE','الإمارات','United Arab Emirates','AED','prepared',false,false,false,false,false,false,false,false,false),
  ('EG','مصر','Egypt','EGP','prepared',false,false,false,false,false,false,false,false,false),
  ('MA','المغرب','Morocco','MAD','prepared',false,false,false,false,false,false,false,false,false),
  ('QA','قطر','Qatar','QAR','prepared',false,false,false,false,false,false,false,false,false),
  ('JO','الأردن','Jordan','JOD','future',false,false,false,false,false,false,false,false,false),
  ('LB','لبنان','Lebanon','LBP','future',false,false,false,false,false,false,false,false,false),
  ('KW','الكويت','Kuwait','KWD','future',false,false,false,false,false,false,false,false,false)
on conflict (country_code) do nothing;

alter table public.market_countries enable row level security;
revoke all on table public.market_countries from anon, authenticated;
grant all on table public.market_countries to service_role;

drop trigger if exists market_countries_set_updated_at on public.market_countries;
create trigger market_countries_set_updated_at
before update on public.market_countries
for each row execute function public.set_updated_at();

alter table public.talents
  add column if not exists base_country_code text null references public.market_countries(country_code);

alter table public.publishers
  add column if not exists country_code text null references public.market_countries(country_code);

alter table public.opportunities
  add column if not exists country_code text null references public.market_countries(country_code),
  add column if not exists currency text null check (currency is null or currency ~ '^[A-Z]{3}$');

alter table public.casting_projects
  add column if not exists country_code text null references public.market_countries(country_code);

alter table public.marketing_briefs
  add column if not exists country_code text null references public.market_countries(country_code);

alter table public.marketing_leads
  add column if not exists country_code text null references public.market_countries(country_code);

create table if not exists public.talent_work_markets (
  talent_id bigint not null references public.talents(id) on delete cascade,
  country_code text not null references public.market_countries(country_code),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (talent_id, country_code)
);

comment on table public.talent_work_markets is
  'Markets where a talent is willing/eligible to accept opportunities; row existence means enabled and is separate from nationality and base location.';

alter table public.talent_work_markets enable row level security;
revoke all on table public.talent_work_markets from anon, authenticated;
grant all on table public.talent_work_markets to service_role;

drop trigger if exists talent_work_markets_set_updated_at on public.talent_work_markets;
create trigger talent_work_markets_set_updated_at
before update on public.talent_work_markets
for each row execute function public.set_updated_at();

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
create index if not exists idx_talent_work_markets_country_code
  on public.talent_work_markets(country_code);
