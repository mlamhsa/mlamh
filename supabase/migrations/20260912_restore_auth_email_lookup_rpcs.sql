create or replace function public.lookup_auth_email_provider(p_email text)
returns table(account_exists boolean, providers text[])
language sql
security definer
set search_path = pg_catalog, public, auth
as $$
  with matched_user as (
    select u.id
    from auth.users u
    where lower(trim(u.email)) = lower(trim(p_email))
    order by u.created_at asc
    limit 1
  ), provider_rows as (
    select distinct lower(i.provider) as provider
    from matched_user mu
    join auth.identities i on i.user_id = mu.id
    where i.provider is not null and trim(i.provider) <> ''
  )
  select
    exists(select 1 from matched_user) as account_exists,
    coalesce((select array_agg(provider order by provider) from provider_rows), array[]::text[]) as providers;
$$;

revoke all on function public.lookup_auth_email_provider(text) from public, anon, authenticated;
grant execute on function public.lookup_auth_email_provider(text) to service_role;

create or replace function public.lookup_other_mlamh_account_by_email(
  p_email text,
  p_exclude_user_id uuid
)
returns table(account_exists boolean, user_id uuid, account_type text)
language sql
security definer
set search_path = pg_catalog, public, auth
as $$
  with matched as (
    select u.id as user_id, p.account_type
    from auth.users u
    join public.profiles p on p.user_id = u.id
    where lower(trim(u.email)) = lower(trim(p_email))
      and u.id <> p_exclude_user_id
      and p.account_type in ('talent', 'publisher')
    order by u.created_at asc
    limit 1
  )
  select
    exists(select 1 from matched) as account_exists,
    (select m.user_id from matched m limit 1) as user_id,
    (select m.account_type from matched m limit 1) as account_type;
$$;

revoke all on function public.lookup_other_mlamh_account_by_email(text, uuid) from public, anon, authenticated;
grant execute on function public.lookup_other_mlamh_account_by_email(text, uuid) to service_role;
