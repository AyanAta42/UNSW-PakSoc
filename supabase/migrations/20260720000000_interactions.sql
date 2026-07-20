-- ── Interactions (audit trail for db-mutating actions) ──────────────────────
-- Paste into: Supabase Dashboard → SQL Editor → New Query → Run
-- Records who did what — event/task create/edit/delete/publish, member
-- assignment changes, etc — so Manage Events and the Tasks board can show a
-- "history" log. entity_id/event_id are plain uuids (not FKs) on purpose:
-- the log must survive the row it describes being deleted.

CREATE TABLE IF NOT EXISTS public.interactions (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id    uuid REFERENCES public.members(id) ON DELETE SET NULL,
  actor_name  text NOT NULL DEFAULT 'Unknown',
  action      text NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('event', 'task')),
  entity_id   uuid,
  event_id    uuid,
  summary     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS interactions_entity_idx  ON public.interactions (entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS interactions_created_idx ON public.interactions (entity_type, created_at DESC);

ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_interactions" ON public.interactions;
DROP POLICY IF EXISTS "write_interactions"       ON public.interactions;

-- Matches the rest of the schema for now: open policies, gated client-side
-- by route (subcom+ only reach Manage Events / Tasks).
CREATE POLICY "public_read_interactions" ON public.interactions FOR SELECT USING (true);
CREATE POLICY "write_interactions"       ON public.interactions FOR ALL    USING (true) WITH CHECK (true);
