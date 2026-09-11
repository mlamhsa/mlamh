create schema if not exists private;

revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

create or replace function private.is_conversation_participant(p_conversation_id bigint)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.conversations c
    left join public.talents t on t.id = c.talent_id
    left join public.publishers p on p.id = c.publisher_id
    left join public.profiles pr on pr.id = p.profile_id
    where c.id = p_conversation_id
      and (
        t.user_id = (select auth.uid())
        or (
          c.conversation_type = 'publisher_talent'
          and pr.user_id = (select auth.uid())
        )
        or (
          c.conversation_type = 'mlamh_talent'
          and c.admin_user_id = (select auth.uid())
        )
      )
  );
$$;

revoke all on function private.is_conversation_participant(bigint) from public, anon;
grant execute on function private.is_conversation_participant(bigint) to authenticated, service_role;

alter policy "Participants can read messages"
on public.messages
using (private.is_conversation_participant(conversation_id));

alter policy "Participants can insert messages"
on public.messages
with check (
  sender_user_id = (select auth.uid())
  and private.is_conversation_participant(conversation_id)
);

alter policy "Participants can read message attachments"
on public.message_attachments
using (private.is_conversation_participant(conversation_id));

alter policy "Participants can insert message attachments"
on public.message_attachments
with check (
  uploader_user_id = (select auth.uid())
  and private.is_conversation_participant(conversation_id)
);

alter policy "Uploaders can delete message attachments"
on public.message_attachments
using (
  uploader_user_id = (select auth.uid())
  and private.is_conversation_participant(conversation_id)
);

alter policy "Conversation participants can read attachments"
on storage.objects
using (
  bucket_id = 'message-attachments'
  and (storage.foldername(name))[1] ~ '^[0-9]+$'
  and private.is_conversation_participant(((storage.foldername(name))[1])::bigint)
);

alter policy "Conversation participants can upload attachments"
on storage.objects
with check (
  bucket_id = 'message-attachments'
  and (storage.foldername(name))[1] ~ '^[0-9]+$'
  and private.is_conversation_participant(((storage.foldername(name))[1])::bigint)
  and (storage.foldername(name))[2] = (select auth.uid())::text
);

alter policy "Uploaders can delete attachments"
on storage.objects
using (
  bucket_id = 'message-attachments'
  and (storage.foldername(name))[1] ~ '^[0-9]+$'
  and private.is_conversation_participant(((storage.foldername(name))[1])::bigint)
  and (storage.foldername(name))[2] = (select auth.uid())::text
);

revoke all on function public.is_conversation_participant(bigint) from public, anon, authenticated;
drop function public.is_conversation_participant(bigint);
