-- Talent profiles contain private media/contact fields on the same row as public fields.
-- RLS can restrict rows, but it cannot safely expose only selected columns from a row.
-- Public talent discovery is served through the server-side sanitized projection instead.
--
-- Keep the owner/admin policies intact. This migration only removes broad public
-- SELECT policies that allow anon/authenticated clients to fetch the full row.

drop policy if exists "public can read published talents" on public.talents;
drop policy if exists "public_read_published_talents" on public.talents;
drop policy if exists "Public can read approved published talents" on public.talents;
