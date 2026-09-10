-- Keep a Talent public URL stable after its slug has been assigned.
-- A blank legacy slug may still be filled once; after that, updates preserve it.

create or replace function public.preserve_existing_talent_slug()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if coalesce(btrim(old.slug), '') <> ''
     and new.slug is distinct from old.slug then
    new.slug := old.slug;
  end if;

  return new;
end;
$$;

drop trigger if exists preserve_talent_slug_after_creation on public.talents;

create trigger preserve_talent_slug_after_creation
before update of slug on public.talents
for each row
execute function public.preserve_existing_talent_slug();
