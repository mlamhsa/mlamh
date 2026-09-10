-- Protect established accounts from accidental reclassification.
-- Existing non-null account_type values are immutable; incomplete legacy
-- profiles can still move from NULL/blank to their first real account type.

create or replace function public.prevent_profile_account_type_change()
returns trigger
language plpgsql
as $$
begin
  if nullif(trim(coalesce(old.account_type, '')), '') is not null
     and nullif(trim(coalesce(new.account_type, '')), '') is distinct from
         nullif(trim(coalesce(old.account_type, '')), '') then
    raise exception 'profile account_type is immutable once assigned';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_profiles_lock_account_type on public.profiles;

create trigger trg_profiles_lock_account_type
before update of account_type on public.profiles
for each row
execute function public.prevent_profile_account_type_change();
