-- Fast server-only duplicate-account lookup across Email/Google/Apple.
-- The function reads auth.users/auth.identities with SECURITY DEFINER, but is
-- executable only by service_role so account-existence data is not exposed to
-- browser clients through PostgREST.

create or replace function public.lookup_auth_email_provider(p_email text)
returns table (
  account_exists boolean,
  providers text[]
)
language sql
security definer
set search_path = public, auth
as $$
  with matched as (
    select id
    from auth.users
    where lower(email) = lower(trim(p_email))
    limit 1
  )
  select
    exists(select 1 from matched) as account_exists,
    coalesce(
      (
        select array_agg(distinct i.provider order by i.provider)
        from auth.identities i
        where i.user_id = (select id from matched)
      ),
      '{}'::text[]
    ) as providers;
$$;

revoke all on function public.lookup_auth_email_provider(text) from public;
revoke all on function public.lookup_auth_email_provider(text) from anon;
revoke all on function public.lookup_auth_email_provider(text) from authenticated;
grant execute on function public.lookup_auth_email_provider(text) to service_role;
