-- ── Realtime broadcasts ───────────────────────────────────────────────────
-- Paste into: Supabase Dashboard → SQL Editor → New Query → Run
-- Adds tables to the supabase_realtime publication so postgres_changes
-- subscriptions fire in the app. Idempotent — safe to re-run.

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['events','social_posts','tasks','subtasks','task_assignments','members'] LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;
