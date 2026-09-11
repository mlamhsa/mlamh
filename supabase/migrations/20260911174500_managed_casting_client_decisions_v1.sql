alter table public.casting_shortlist
  drop constraint if exists casting_shortlist_status_check;

alter table public.casting_shortlist
  add constraint casting_shortlist_status_check
  check (
    status = any (
      array[
        'shortlisted'::text,
        'presented'::text,
        'reserved'::text,
        'selected'::text,
        'declined'::text,
        'withdrawn'::text
      ]
    )
  );

alter table public.casting_projects
  add column if not exists client_selection_confirmed_at timestamptz;

alter table public.casting_projects
  add column if not exists client_selection_note text;
