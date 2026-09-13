create or replace function public.enforce_active_publisher_opportunity_scope()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.publisher_id is not null then
    if new.opportunity_type is null
      or lower(trim(new.opportunity_type)) not in ('actor', 'model') then
      raise exception 'Publisher opportunities are currently limited to actor and model.'
        using errcode = '23514';
    end if;

    new.opportunity_type := lower(trim(new.opportunity_type));
    new.country_code := 'SA';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_active_publisher_opportunity_scope_trigger
on public.opportunities;

create trigger enforce_active_publisher_opportunity_scope_trigger
before insert or update of publisher_id, opportunity_type, country_code
on public.opportunities
for each row
execute function public.enforce_active_publisher_opportunity_scope();
