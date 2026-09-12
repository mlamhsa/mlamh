update storage.buckets
set file_size_limit = 5 * 1024 * 1024,
    allowed_mime_types = array['image/jpeg','image/png','image/webp']
where id in ('publisher-assets','talent-images');

update storage.buckets
set file_size_limit = 10 * 1024 * 1024,
    allowed_mime_types = array['image/jpeg','image/png','image/webp']
where id = 'talent-gallery';
