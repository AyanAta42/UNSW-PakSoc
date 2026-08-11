-- ── Next release price teaser ─────────────────────────────────────────────
-- Optional line rendered under the CTA buttons on the home hero banner, e.g.
--   "Final Release Price $75"
-- Two independent columns so the label is free text ("Final Release", "Tier 2
-- Price", …) rather than a hardcoded string in the client.
--
-- Both are nullable with no default: an event without a next release keeps
-- them NULL and the banner renders nothing extra.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS next_release_label text,
  ADD COLUMN IF NOT EXISTS next_release_price numeric;

-- ── Rollback (paste to revert) ────────────────────────────────────────────
-- ALTER TABLE public.events
--   DROP COLUMN IF EXISTS next_release_label,
--   DROP COLUMN IF EXISTS next_release_price;
