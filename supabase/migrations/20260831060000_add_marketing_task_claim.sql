create or replace function public.claim_next_marketing_task(p_worker_id text)
returns setof public.marketing_tasks
language plpgsql
as $$
declare
  v_task_id bigint;
begin
  select id into v_task_id
  from public.marketing_tasks
  where
    status in ('queued','scheduled')
    and (scheduled_at is null or scheduled_at <= now())
    and retry_count <= max_retries
    and (
      (approval_level = 'auto' and approval_status = 'not_required')
      or
      (approval_level in ('approval_required','ceo_only') and approval_status = 'approved')
    )
    and locked_at is null
  order by
    case priority when 'urgent' then 1 when 'high' then 2 when 'normal' then 3 else 4 end,
    coalesce(scheduled_at, created_at),
    created_at
  for update skip locked
  limit 1;

  if v_task_id is null then
    return;
  end if;

  return query
  update public.marketing_tasks
  set
    status = 'running',
    started_at = coalesce(started_at, now()),
    locked_at = now(),
    locked_by = p_worker_id,
    updated_at = now()
  where id = v_task_id
  returning *;
end;
$$;

revoke all on function public.claim_next_marketing_task(text) from public;
revoke all on function public.claim_next_marketing_task(text) from anon;
revoke all on function public.claim_next_marketing_task(text) from authenticated;
grant execute on function public.claim_next_marketing_task(text) to service_role;
