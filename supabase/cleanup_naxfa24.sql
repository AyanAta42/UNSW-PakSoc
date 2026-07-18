-- ── Remove all social wall data fetched from naxfa_24 ─────────────────────
-- Paste into: Supabase Dashboard → SQL Editor → New Query → Run

DELETE FROM public.social_posts WHERE username = 'naxfa_24';

-- Sweep orphaned thumbnails: any file in social-thumbs no social_posts row points at
DELETE FROM storage.objects o
WHERE o.bucket_id = 'social-thumbs'
  AND NOT EXISTS (
    SELECT 1 FROM public.social_posts p
    WHERE p.thumbnail_url LIKE '%/social-thumbs/' || o.name || '%'
  );

-- If the storage delete errors with "must be owner" / "permission denied",
-- delete the files instead via Dashboard → Storage → social-thumbs.
