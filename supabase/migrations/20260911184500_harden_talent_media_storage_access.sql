update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg','image/png','image/webp']::text[]
where id = 'talent-media';

drop policy if exists "Public can upload to talent-media" on storage.objects;
drop policy if exists "Authenticated users can delete media" on storage.objects;
drop policy if exists "Authenticated users can update media" on storage.objects;

alter policy "Authenticated users can upload media"
on storage.objects
with check (
  bucket_id = 'talent-media'
  and (select auth.uid()) = owner
  and (storage.foldername(name))[1] in ('profile-images','gallery')
  and name ~* '^(profile-images|gallery)/[0-9a-f-]{36}\.(jpe?g|png|webp)$'
);
