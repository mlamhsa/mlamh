create or replace function public.sync_marketing_agent_from_task()
returns trigger
language plpgsql
as $$
begin
  if new.agent_id is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    update public.marketing_agents
    set
      current_task_id = new.id,
      status = case
        when new.status = 'waiting_approval' then 'waiting_approval'
        when new.status = 'scheduled' then 'scheduled'
        else 'scheduled'
      end,
      next_scheduled_task_at = new.scheduled_at,
      updated_at = now()
    where id = new.agent_id;
    return new;
  end if;

  if old.status is distinct from new.status then
    if new.status = 'running' then
      update public.marketing_agents
      set current_task_id = new.id, status = 'working', last_action_at = now(), updated_at = now()
      where id = new.agent_id;
    elsif new.status = 'waiting_approval' then
      update public.marketing_agents
      set current_task_id = new.id, status = 'waiting_approval', updated_at = now()
      where id = new.agent_id;
    elsif new.status = 'scheduled' then
      update public.marketing_agents
      set current_task_id = new.id, status = 'scheduled', next_scheduled_task_at = new.scheduled_at, updated_at = now()
      where id = new.agent_id;
    elsif new.status = 'completed' then
      update public.marketing_agents
      set current_task_id = null, status = 'idle', tasks_completed = tasks_completed + 1, last_action_at = now(), next_scheduled_task_at = null, updated_at = now()
      where id = new.agent_id;
    elsif new.status = 'failed' then
      update public.marketing_agents
      set current_task_id = null, status = 'error', tasks_failed = tasks_failed + 1, last_action_at = now(), next_scheduled_task_at = null, updated_at = now()
      where id = new.agent_id;
    elsif new.status = 'cancelled' then
      update public.marketing_agents
      set current_task_id = null, status = 'idle', next_scheduled_task_at = null, updated_at = now()
      where id = new.agent_id;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists marketing_tasks_sync_agent_state on public.marketing_tasks;
create trigger marketing_tasks_sync_agent_state
after insert or update of status, scheduled_at on public.marketing_tasks
for each row execute function public.sync_marketing_agent_from_task();
