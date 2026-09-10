-- Talent dashboard realtime coverage.
-- profiles, talents, notifications and messages are already in the realtime
-- publication in production. Add the remaining Talent dashboard sources
-- idempotently so applications, conversations and saved opportunities can
-- refresh without a manual browser reload.

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'opportunity_applications',
    'conversations',
    'saved_opportunities'
  ]
  loop
    if to_regclass(format('public.%I', table_name)) is not null
      and not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = table_name
      )
    then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end
$$;
