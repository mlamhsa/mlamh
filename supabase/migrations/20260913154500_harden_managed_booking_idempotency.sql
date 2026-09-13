-- A managed booking proposal is a one-time transition per booking.
-- Prevent retries or concurrent requests from creating duplicate proposal events,
-- which also makes the downstream talent notification idempotent.
create unique index if not exists events_managed_booking_proposed_target_unique_idx
  on public.events (event_type, target_type, target_id)
  where event_type = 'managed_casting_booking_proposed'
    and target_type = 'booking';
