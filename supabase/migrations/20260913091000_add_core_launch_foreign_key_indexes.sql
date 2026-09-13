create index if not exists opportunities_publisher_id_idx
  on public.opportunities (publisher_id);

create index if not exists opportunity_applications_talent_id_idx
  on public.opportunity_applications (talent_id);

create index if not exists messages_sender_user_id_idx
  on public.messages (sender_user_id);

create index if not exists notifications_event_id_idx
  on public.notifications (event_id);
