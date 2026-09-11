create index if not exists casting_project_files_uploaded_by_idx
  on public.casting_project_files(uploaded_by)
  where uploaded_by is not null;
