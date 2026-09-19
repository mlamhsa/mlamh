-- Audit-log query indexes for actor history, target history, and chronological filtering.
-- Non-destructive and safe to apply repeatedly.

create index if not exists events_actor_created_at_idx
  on public.events (actor_id, created_at desc)
  where actor_id is not null;

create index if not exists events_target_type_created_at_idx
  on public.events (target_type, created_at desc);

create index if not exists events_event_type_created_at_idx
  on public.events (event_type, created_at desc);

create index if not exists events_target_id_created_at_idx
  on public.events (target_id, created_at desc)
  where target_id is not null;
