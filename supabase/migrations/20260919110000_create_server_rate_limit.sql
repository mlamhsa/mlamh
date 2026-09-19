-- Shared server-side rate limiter used by public/mobile APIs.
-- The function is intentionally service-role only; clients cannot consume or inspect counters.

create table if not exists public.server_rate_limits (
  key_hash text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.server_rate_limits enable row level security;

revoke all on table public.server_rate_limits from public, anon, authenticated;
grant select, insert, update on table public.server_rate_limits to service_role;

create or replace function public.consume_support_rate_limit(
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  remaining integer,
  retry_after_seconds integer
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_window_started_at timestamptz;
  v_request_count integer;
begin
  if coalesce(length(trim(p_key_hash)), 0) = 0 or p_limit <= 0 or p_window_seconds <= 0 then
    raise exception 'invalid rate limit input';
  end if;

  insert into public.server_rate_limits as limits (
    key_hash,
    window_started_at,
    request_count,
    updated_at
  )
  values (
    p_key_hash,
    v_now,
    1,
    v_now
  )
  on conflict (key_hash) do update
  set
    window_started_at = case
      when limits.window_started_at + make_interval(secs => p_window_seconds) <= v_now
        then v_now
      else limits.window_started_at
    end,
    request_count = case
      when limits.window_started_at + make_interval(secs => p_window_seconds) <= v_now
        then 1
      else limits.request_count + 1
    end,
    updated_at = v_now
  returning limits.window_started_at, limits.request_count
    into v_window_started_at, v_request_count;

  allowed := v_request_count <= p_limit;
  remaining := greatest(p_limit - v_request_count, 0);
  retry_after_seconds := greatest(
    ceil(extract(epoch from (
      v_window_started_at + make_interval(secs => p_window_seconds) - v_now
    )))::integer,
    0
  );

  return next;
end;
$$;

revoke all on function public.consume_support_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_support_rate_limit(text, integer, integer) to service_role;
