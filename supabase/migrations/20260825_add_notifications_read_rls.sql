-- Security:
-- Authenticated users may read only notifications addressed to them.
-- Notification creation and privileged updates remain server-side via service role.

drop policy if exists "Users can read own notifications"
on public.notifications;

create policy "Users can read own notifications"
on public.notifications
for select
to authenticated
using (
  (
    recipient_type = 'talent'
    and recipient_id = auth.uid()::text
  )
  or
  (
    recipient_type = 'publisher'
    and exists (
      select 1
      from public.publishers p
      join public.profiles pr
        on pr.id = p.profile_id
      where p.id::text = notifications.recipient_id
        and pr.user_id = auth.uid()
    )
  )
);
