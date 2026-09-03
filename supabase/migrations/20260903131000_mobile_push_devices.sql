-- Prepared only. Do not apply to production without explicit approval.

create table if not exists public.mobile_push_devices (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  expo_push_token text not null unique,
  platform text not null check (platform in ('ios', 'android')),
  device_id text null,
  app_version text null,
  locale text not null default 'ar' check (locale in ('ar', 'en')),
  enabled boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mobile_push_devices_user_id_idx
  on public.mobile_push_devices(user_id)
  where enabled = true;

alter table public.mobile_push_devices enable row level security;

-- Intentionally no direct client policies. Mobile registration goes through
-- authenticated server endpoints which verify the bearer token and use the
-- server-side admin client. Provider credentials and token mutation stay off-device.
