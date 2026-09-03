-- Prepared only. Do not apply to production without explicit approval.
-- Align talent notification RLS with the current notification schema where
-- recipient_id stores talents.id as text for recipient_type = 'talent'.

drop policy if exists "Users can read own notifications" on public.notifications;

create policy "Users can read own notifications"
on public.notifications
for select
to authenticated
using (
  (
    recipient_type = 'talent'
    and (
      recipient_id = auth.uid()::text
      or exists (
        select 1
        from public.talents t
        where t.id::text = notifications.recipient_id
          and t.user_id = auth.uid()
      )
    )
  )
  or
  (
    recipient_type = 'publisher'
    and exists (
      select 1
      from public.publishers p
      join public.profiles pr on pr.id = p.profile_id
      where p.id::text = notifications.recipient_id
        and pr.user_id = auth.uid()
    )
  )
);
