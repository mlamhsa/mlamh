-- Managed booking transitions must be idempotent at the database boundary.

-- One acceptance audit event per managed application. Concurrent confirmation
-- requests can observe the same application transition, so keep the audit unique.
create unique index if not exists events_managed_application_accepted_target_unique_idx
  on public.events (event_type, target_type, target_id)
  where event_type = 'managed_casting_application_accepted'
    and target_type = 'application';

-- One proposal event per booking. This also makes the downstream talent
-- notification idempotent because notifications are created only after this event.
create unique index if not exists events_managed_booking_proposed_target_unique_idx
  on public.events (event_type, target_type, target_id)
  where event_type = 'managed_casting_booking_proposed'
    and target_type = 'booking';
