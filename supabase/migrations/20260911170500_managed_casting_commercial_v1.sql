alter table public.casting_projects
  add column if not exists launch_offer_slot smallint,
  add column if not exists launch_offer_identity text,
  add column if not exists payment_plan text not null default 'quote_pending';

alter table public.casting_projects
  drop constraint if exists casting_projects_launch_offer_slot_check;
alter table public.casting_projects
  add constraint casting_projects_launch_offer_slot_check
  check (launch_offer_slot is null or launch_offer_slot between 1 and 5);

alter table public.casting_projects
  drop constraint if exists casting_projects_payment_plan_check;
alter table public.casting_projects
  add constraint casting_projects_payment_plan_check
  check (payment_plan in ('quote_pending','launch_free','basic_upfront','pro_50_50','enterprise_milestone'));

create unique index if not exists casting_projects_launch_offer_slot_key
  on public.casting_projects (launch_offer_slot)
  where launch_offer_slot is not null;

create index if not exists casting_projects_launch_offer_identity_idx
  on public.casting_projects (launch_offer_identity)
  where launch_offer_identity is not null;

alter table public.casting_payments
  add column if not exists public_id uuid not null default gen_random_uuid(),
  add column if not exists milestone_code text,
  add column if not exists milestone_sequence integer,
  add column if not exists due_percent numeric(5,2),
  add column if not exists provider_payment_id text,
  add column if not exists checkout_created_at timestamptz;

create unique index if not exists casting_payments_public_id_key
  on public.casting_payments (public_id);
create unique index if not exists casting_payments_provider_payment_id_key
  on public.casting_payments (provider_payment_id)
  where provider_payment_id is not null;
create unique index if not exists casting_payments_project_milestone_key
  on public.casting_payments (casting_project_id, milestone_code)
  where milestone_code is not null;

create or replace function public.claim_managed_casting_launch_offer(p_project_id bigint)
returns table(is_free boolean, slot smallint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project public.casting_projects%rowtype;
  v_identity text;
  v_slot smallint;
begin
  perform pg_advisory_xact_lock(hashtext('managed_casting_launch_offer_v1'));

  select * into v_project
  from public.casting_projects
  where id = p_project_id and service_mode = 'managed'
  for update;

  if not found then
    raise exception 'Managed casting project not found';
  end if;

  if v_project.launch_offer_slot is not null then
    return query select true, v_project.launch_offer_slot;
    return;
  end if;

  v_identity := case
    when nullif(lower(trim(v_project.contact_email)), '') is not null
      then 'email:' || lower(trim(v_project.contact_email))
    when nullif(regexp_replace(coalesce(v_project.contact_phone, ''), '[^0-9+]', '', 'g'), '') is not null
      then 'phone:' || regexp_replace(v_project.contact_phone, '[^0-9+]', '', 'g')
    else 'project:' || v_project.id::text
  end;

  if exists (
    select 1 from public.casting_projects
    where service_mode = 'managed'
      and launch_offer_identity = v_identity
      and launch_offer_slot is not null
      and id <> p_project_id
  ) then
    update public.casting_projects
      set launch_offer_identity = v_identity,
          payment_plan = case package_code when 'starter' then 'basic_upfront' when 'pro' then 'pro_50_50' when 'custom' then 'enterprise_milestone' else 'quote_pending' end,
          updated_at = now()
    where id = p_project_id;
    return query select false, null::smallint;
    return;
  end if;

  select candidate into v_slot
  from generate_series(1,5) as candidate
  where not exists (
    select 1 from public.casting_projects p where p.launch_offer_slot = candidate
  )
  order by candidate
  limit 1;

  if v_slot is not null then
    update public.casting_projects
      set launch_offer_slot = v_slot,
          launch_offer_identity = v_identity,
          payment_plan = 'launch_free',
          quoted_amount = 0,
          commercial_status = 'won',
          updated_at = now()
    where id = p_project_id;
    return query select true, v_slot;
    return;
  end if;

  update public.casting_projects
    set launch_offer_identity = v_identity,
        payment_plan = case package_code when 'starter' then 'basic_upfront' when 'pro' then 'pro_50_50' when 'custom' then 'enterprise_milestone' else 'quote_pending' end,
        updated_at = now()
  where id = p_project_id;

  return query select false, null::smallint;
end;
$$;

revoke all on function public.claim_managed_casting_launch_offer(bigint) from public, anon, authenticated;
grant execute on function public.claim_managed_casting_launch_offer(bigint) to service_role;
