-- ── Interactions: per-event index ──────────────────────────────────────────
-- Paste into: Supabase Dashboard → SQL Editor → New Query → Run
-- fetchEventTaskInteractions() filters on (event_id, entity_type) and sorts by
-- created_at DESC. The existing indexes lead with entity_type, so that query
-- couldn't use one — this composite index (event_id first) serves it directly,
-- keeping the .limit(100) history fetch fast as the audit trail grows.

CREATE INDEX IF NOT EXISTS interactions_event_idx
  ON public.interactions (event_id, entity_type, created_at DESC);
