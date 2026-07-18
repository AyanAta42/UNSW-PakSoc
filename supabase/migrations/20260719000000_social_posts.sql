-- ── Social posts (Instagram reels/posts mirrored into Supabase) ───────────
-- Paste into: Supabase Dashboard → SQL Editor → New Query → Run

CREATE TABLE IF NOT EXISTS public.social_posts (
  id            text PRIMARY KEY,          -- Instagram media id
  username      text NOT NULL,
  media_type    text NOT NULL,             -- IMAGE | VIDEO | CAROUSEL_ALBUM
  caption       text DEFAULT '',
  thumbnail_url text NOT NULL,             -- image to render (reel thumbnail / post image)
  permalink     text NOT NULL,             -- instagram.com link to the reel/post
  like_count    integer DEFAULT 0,
  posted_at     timestamptz,
  fetched_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_social_posts" ON public.social_posts;
DROP POLICY IF EXISTS "write_social_posts"       ON public.social_posts;

CREATE POLICY "public_read_social_posts" ON public.social_posts FOR SELECT USING (true);
CREATE POLICY "write_social_posts"       ON public.social_posts FOR ALL USING (true) WITH CHECK (true);

-- ── Storage bucket for mirrored thumbnails ────────────────────────────────
-- Instagram CDN URLs expire; the refetch button copies the image here instead.

INSERT INTO storage.buckets (id, name, public)
VALUES ('social-thumbs', 'social-thumbs', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public_read_social_thumbs" ON storage.objects;
DROP POLICY IF EXISTS "insert_social_thumbs"      ON storage.objects;
DROP POLICY IF EXISTS "update_social_thumbs"      ON storage.objects;

CREATE POLICY "public_read_social_thumbs" ON storage.objects
  FOR SELECT USING (bucket_id = 'social-thumbs');
CREATE POLICY "insert_social_thumbs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'social-thumbs');
CREATE POLICY "update_social_thumbs" ON storage.objects
  FOR UPDATE USING (bucket_id = 'social-thumbs') WITH CHECK (bucket_id = 'social-thumbs');
