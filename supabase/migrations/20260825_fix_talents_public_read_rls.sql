-- Security hardening:
-- Public users must only be able to read approved + published talents.
-- Remove legacy permissive policies that bypass this restriction.

drop policy if exists "Allow public read talents"
on public.talents;

drop policy if exists "Allow public read published talents"
on public.talents;
