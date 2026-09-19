-- Reconcile the shared server-side rate limiter with the database state used by
-- production. Only the backend service role can access counters or execute the RPC.

create table if not exists public.support_rate_limits (
  key_hash text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.support_rate_limits enable row level security;

revoke all on table public.support_rate_limits from public, anon, authenticated;
grant select, insert, update on table public.support_rate_limits to service_role;

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
set search_path = ''
as $$
declare
  v_count integer;
  v_window_started_at timestamptz;
  v_now timestamptz := now();
  v_window interval;
begin
  if length(trim(coalesce(p_key_hash, ''))) < 32 then
    raise exception 'INVALID_RATE_LIMIT_KEY';
  end if;

  if p_limit < 1 or p_limit > 1000 then
    raise exception 'INVALID_RATE_LIMIT_LIMIT';
  end if;

  if p_window_seconds < 1 or p_window_seconds > 604800 then
    raise exception 'INVALID_RATE_LIMIT_WINDOW';
  end if;

  v_window := make_interval(secs => p_window_seconds);

  insert into public.support_rate_limits as limits (
    key_hash,
    window_started_at,
    request_count,
    updated_at
  )
  values (
    trim(p_key_hash),
    v_now,
    1,
    v_now
  )
  on conflict (key_hash) do update
  set
    request_count = case
      when limits.window_started_at <= v_now - v_window then 1
      else limits.request_count + 1
    end,
    window_started_at = case
      when limits.window_started_at <= v_now - v_window then v_now
      else limits.window_started_at
    end,
    updated_at = v_now
  returning limits.request_count, limits.window_started_at
    into v_count, v_window_started_at;

  return query
  select
    v_count <= p_limit,
    greatest(p_limit - v_count, 0),
    case
      when v_count <= p_limit then 0
      else greatest(
        1,
        ceil(extract(epoch from (v_window_started_at + v_window - v_now)))::integer
      )
    end;
end;
$$;

revoke all on function public.consume_support_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_support_rate_limit(text, integer, integer) to service_role;