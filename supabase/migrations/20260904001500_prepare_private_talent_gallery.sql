-- PREPARED ONLY: do not apply to production until every web/mobile talent-media reader
-- resolves talent-gallery references through signed URLs or an authorized media endpoint.
-- This migration intentionally does not alter existing talent rows; stored public-style
-- URLs remain stable locators whose storage path can be signed server-side after cutover.

update storage.buckets
set public = false
where id = 'talent-gallery'
  and public = true;
