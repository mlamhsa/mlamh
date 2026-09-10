-- Server-only guard for OAuth flows that may create a second Supabase Auth user
-- for an email that already belongs to an existing MLAMH profile.
--
-- This intentionally looks for a DIFFERENT auth user that already owns a
-- public.profiles row. It is used after OAuth callback exchange to stop a
-- duplicate onboarding journey without guessing or merging identities.

create or replace function public.lookup_other_mlamh_account_by_email(
  p_email text,
  p_exclude_user_id uuid
)
returns table (
  account_exists boolean,
  user_id uuid,
  account_type text,
  providers text[]
)
language sql
security definer
set search_path = public, auth
as $$
  with matched as (
    select u.id, p.account_type
    from auth.users u
    join public.profiles p on p.user_id = u.id
    where lower(u.email) = lower(trim(p_email))
      and (p_exclude_user_id is null or u.id <> p_exclude_user_id)
    limit 1
  )
  select
    exists(select 1 from matched) as account_exists,
    (select id from matched) as user_id,
    (select account_type from matched) as account_type,
    coalesce(
      (
        select array_agg(distinct i.provider order by i.provider)
        from auth.identities i
        where i.user_id = (select id from matched)
      ),
      '{}'::text[]
    ) as providers;
$$;

revoke all on function public.lookup_other_mlamh_account_by_email(text, uuid) from public;
revoke all on function public.lookup_other_mlamh_account_by_email(text, uuid) from anon;
revoke all on function public.lookup_other_mlamh_account_by_email(text, uuid) from authenticated;
grant execute on function public.lookup_other_mlamh_account_by_email(text, uuid) to service_role;
