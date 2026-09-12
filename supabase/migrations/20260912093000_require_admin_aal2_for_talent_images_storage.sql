drop policy if exists "Admins can upload talent images" on storage.objects;
drop policy if exists "Admins can update talent images" on storage.objects;
drop policy if exists "Admins can delete talent images" on storage.objects;

create policy "Admins can upload talent images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'talent-images'
  and (auth.jwt() ->> 'aal') = 'aal2'
  and exists (
    select 1 from public.admin_users au
    where au.id = auth.uid() and au.role = 'admin'
  )
);

create policy "Admins can update talent images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'talent-images'
  and (auth.jwt() ->> 'aal') = 'aal2'
  and exists (
    select 1 from public.admin_users au
    where au.id = auth.uid() and au.role = 'admin'
  )
)
with check (
  bucket_id = 'talent-images'
  and (auth.jwt() ->> 'aal') = 'aal2'
  and exists (
    select 1 from public.admin_users au
    where au.id = auth.uid() and au.role = 'admin'
  )
);

create policy "Admins can delete talent images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'talent-images'
  and (auth.jwt() ->> 'aal') = 'aal2'
  and exists (
    select 1 from public.admin_users au
    where au.id = auth.uid() and au.role = 'admin'
  )
);
