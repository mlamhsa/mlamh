alter table public.casting_payments add column if not exists checkout_url text;

create or replace function public.prepare_managed_casting_commercial_terms()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_identity text;
  v_slot smallint;
begin
  if new.service_mode <> 'managed' then return new; end if;

  if old.status = 'new' and new.status <> 'new' and old.launch_offer_identity is null then
    perform pg_advisory_xact_lock(hashtext('managed_casting_launch_offer_v1'));
    v_identity := case
      when nullif(lower(trim(new.contact_email)), '') is not null then 'email:' || lower(trim(new.contact_email))
      when nullif(regexp_replace(coalesce(new.contact_phone, ''), '[^0-9+]', '', 'g'), '') is not null then 'phone:' || regexp_replace(new.contact_phone, '[^0-9+]', '', 'g')
      else 'project:' || new.id::text
    end;
    new.launch_offer_identity := v_identity;

    if not exists (
      select 1 from public.casting_projects p
      where p.service_mode = 'managed'
        and p.launch_offer_identity = v_identity
        and p.launch_offer_slot is not null
        and p.id <> new.id
    ) then
      select candidate into v_slot
      from generate_series(1, 5) as candidate
      where not exists (select 1 from public.casting_projects p where p.launch_offer_slot = candidate)
      order by candidate limit 1;
    end if;

    if v_slot is not null then
      new.launch_offer_slot := v_slot;
      new.payment_plan := 'launch_free';
      new.quoted_amount := 0;
      new.commercial_status := 'won';
      new.client_status_note := coalesce(new.client_status_note, 'تم قبول مشروعكم ضمن عرض الإطلاق لأول 5 عملاء — إدارة الكاستينغ لهذا المشروع بدون رسوم خدمة.');
      return new;
    end if;
  end if;

  if new.launch_offer_slot is null then
    new.payment_plan := case new.package_code
      when 'starter' then 'basic_upfront'
      when 'pro' then 'pro_50_50'
      when 'custom' then 'enterprise_milestone'
      else 'quote_pending'
    end;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prepare_managed_casting_commercial_terms on public.casting_projects;
create trigger trg_prepare_managed_casting_commercial_terms
before update on public.casting_projects
for each row execute function public.prepare_managed_casting_commercial_terms();

create or replace function public.sync_managed_casting_payment_schedule()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_quote numeric;
  v_first numeric;
  v_second numeric;
begin
  if new.service_mode <> 'managed' then return new; end if;

  if new.payment_plan = 'launch_free' then
    delete from public.casting_payments
    where casting_project_id = new.id
      and milestone_code in ('upfront','activation','pre_booking')
      and status <> 'paid';
    return new;
  end if;

  v_quote := coalesce(new.quoted_amount, 0);
  if v_quote <= 0 then return new; end if;

  if new.payment_plan = 'basic_upfront' then
    insert into public.casting_payments (casting_project_id,status,amount,currency,provider,milestone_code,milestone_sequence,due_percent,internal_notes)
    values (new.id,'pending',v_quote,new.currency,'tap','upfront',1,100,'Managed Basic — 100% before activation')
    on conflict (casting_project_id, milestone_code) where milestone_code is not null
    do update set
      amount = case when public.casting_payments.status = 'paid' then public.casting_payments.amount else excluded.amount end,
      currency = excluded.currency,
      due_percent = excluded.due_percent,
      updated_at = now();
  elsif new.payment_plan = 'pro_50_50' then
    v_first := round(v_quote * 0.50, 2);
    v_second := v_quote - v_first;
    insert into public.casting_payments (casting_project_id,status,amount,currency,provider,milestone_code,milestone_sequence,due_percent,internal_notes)
    values
      (new.id,'pending',v_first,new.currency,'tap','activation',1,50,'Managed Pro — 50% to activate casting'),
      (new.id,'pending',v_second,new.currency,'tap','pre_booking',2,50,'Managed Pro — remaining 50% before talent confirmation')
    on conflict (casting_project_id, milestone_code) where milestone_code is not null
    do update set
      amount = case when public.casting_payments.status = 'paid' then public.casting_payments.amount else excluded.amount end,
      currency = excluded.currency,
      due_percent = excluded.due_percent,
      updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_managed_casting_payment_schedule on public.casting_projects;
create trigger trg_sync_managed_casting_payment_schedule
after insert or update of package_code, quoted_amount, currency, payment_plan, launch_offer_slot on public.casting_projects
for each row execute function public.sync_managed_casting_payment_schedule();

create or replace function public.managed_casting_can_source(p_project_id bigint)
returns boolean
language sql
stable
set search_path = public
as $$
  select case
    when p.launch_offer_slot is not null or p.payment_plan = 'launch_free' then true
    when p.payment_plan = 'basic_upfront' then exists (select 1 from public.casting_payments cp where cp.casting_project_id = p.id and cp.milestone_code = 'upfront' and cp.status = 'paid')
    when p.payment_plan = 'pro_50_50' then exists (select 1 from public.casting_payments cp where cp.casting_project_id = p.id and cp.milestone_code = 'activation' and cp.status = 'paid')
    when p.payment_plan = 'enterprise_milestone' then exists (select 1 from public.casting_payments cp where cp.casting_project_id = p.id and cp.status = 'paid')
    else false
  end
  from public.casting_projects p
  where p.id = p_project_id and p.service_mode = 'managed';
$$;

create or replace function public.managed_casting_can_confirm_talent(p_project_id bigint)
returns boolean
language sql
stable
set search_path = public
as $$
  select case
    when p.launch_offer_slot is not null or p.payment_plan = 'launch_free' then true
    when p.payment_plan = 'pro_50_50' then exists (select 1 from public.casting_payments cp where cp.casting_project_id = p.id and cp.milestone_code = 'pre_booking' and cp.status = 'paid')
    when p.payment_plan = 'basic_upfront' then public.managed_casting_can_source(p.id)
    when p.payment_plan = 'enterprise_milestone' then not exists (select 1 from public.casting_payments cp where cp.casting_project_id = p.id and cp.milestone_code = 'pre_booking' and cp.status <> 'paid')
    else false
  end
  from public.casting_projects p
  where p.id = p_project_id and p.service_mode = 'managed';
$$;
