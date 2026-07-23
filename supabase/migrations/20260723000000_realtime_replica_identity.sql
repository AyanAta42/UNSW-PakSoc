-- ── Realtime: make UPDATE/DELETE broadcast reliably ───────────────────────
-- Paste into: Supabase Dashboard → SQL Editor → New Query → Run
--
-- Symptom this fixes: editing or announcing an event does not push to other
-- devices in realtime (it only appears after refocusing the tab / reloading).
--
-- Two things are required for postgres_changes to fire, and the earlier
-- migration only did the first:
--   1. the table is in the `supabase_realtime` publication, AND
--   2. the table has REPLICA IDENTITY FULL — without it Postgres omits the row
--      image on UPDATE/DELETE, so Realtime cannot evaluate RLS and drops the
--      change. INSERTs still work, which is why announces sometimes seemed to.
-- Idempotent — safe to re-run.

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['events','social_posts','tasks','subtasks','task_assignments','members'] LOOP
    -- 1. Ensure the table is published for realtime
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    -- 2. Emit the full row on UPDATE/DELETE so changes reach subscribers
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
  END LOOP;
END $$;

-- Verify (optional): every table above should be listed here after running.
-- SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
