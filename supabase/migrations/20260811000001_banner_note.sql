-- ── Banner note supersedes the next-release pair ──────────────────────────
-- The label + numeric price added by 20260811000000 collapse into one free-text
-- line rendered under the hero CTAs, e.g. "Final Release At $75". The client
-- highlights any "$<amount>" inside the text, so the price no longer needs a
-- column of its own — and the field is now a general note, not release-specific.
--
-- Self-sufficient: run this alone whether or not 20260811000000 was applied.
-- The backfill is guarded on the old columns existing, so nothing typed into
-- them is lost.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS banner_note text;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'events'
      AND column_name  = 'next_release_label'
  ) THEN
    UPDATE public.events
       SET banner_note = trim(concat_ws(' ',
             nullif(next_release_label, ''),
             CASE WHEN next_release_price IS NOT NULL
                  THEN '$' || next_release_price::text
             END))
     WHERE banner_note IS NULL
       AND (next_release_label IS NOT NULL OR next_release_price IS NOT NULL);
  END IF;
END $$;

ALTER TABLE public.events
  DROP COLUMN IF EXISTS next_release_label,
  DROP COLUMN IF EXISTS next_release_price;

-- ── Rollback (paste to revert) ────────────────────────────────────────────
-- ALTER TABLE public.events
--   ADD COLUMN IF NOT EXISTS next_release_label text,
--   ADD COLUMN IF NOT EXISTS next_release_price numeric;
-- ALTER TABLE public.events DROP COLUMN IF EXISTS banner_note;
