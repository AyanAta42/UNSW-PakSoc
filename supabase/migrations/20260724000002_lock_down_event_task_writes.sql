-- ── Server-side write lockdown for events / tasks ─────────────────────────
-- Same root cause as the members lockdown: the anon key is public, so the
-- wide-open `write_* USING(true)` policies let ANYONE create or delete events,
-- tasks, subtasks and assignments straight from the REST API — regardless of
-- what the UI shows. This restricts every write (INSERT / UPDATE / DELETE) to
-- committee members: subcom, executive, vice_president, president, or a dev.
--
-- Reads are left public on purpose:
--   • events must be readable by the public home / all-events pages
--   • task data is only ever read by subcom+ screens, so leaving it readable
--     is harmless and you've said raw-API read visibility is acceptable
--
-- Run order matters: this depends on the is_developer column, so apply the
-- 20260724000000 (developer flag) migration first.

-- Is this user a committee member (anyone above 'public'), or a developer?
-- SECURITY DEFINER so it reads members as the owner, bypassing members' RLS.
CREATE OR REPLACE FUNCTION public.is_committee_member(uid uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.members
    WHERE user_id = uid
      AND (role <> 'public' OR is_developer = true)
  );
$$;

-- events ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS write_events ON public.events;
CREATE POLICY write_events ON public.events
  FOR ALL TO authenticated
  USING      (public.is_committee_member(auth.uid()))
  WITH CHECK (public.is_committee_member(auth.uid()));

-- tasks ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS write_tasks ON public.tasks;
CREATE POLICY write_tasks ON public.tasks
  FOR ALL TO authenticated
  USING      (public.is_committee_member(auth.uid()))
  WITH CHECK (public.is_committee_member(auth.uid()));

-- subtasks ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS write_subtasks ON public.subtasks;
CREATE POLICY write_subtasks ON public.subtasks
  FOR ALL TO authenticated
  USING      (public.is_committee_member(auth.uid()))
  WITH CHECK (public.is_committee_member(auth.uid()));

-- task_assignments ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS write_assign ON public.task_assignments;
CREATE POLICY write_assign ON public.task_assignments
  FOR ALL TO authenticated
  USING      (public.is_committee_member(auth.uid()))
  WITH CHECK (public.is_committee_member(auth.uid()));

-- ── Rollback (paste to revert) ────────────────────────────────────────────
-- DROP POLICY IF EXISTS write_events ON public.events;
-- DROP POLICY IF EXISTS write_tasks  ON public.tasks;
-- DROP POLICY IF EXISTS write_subtasks ON public.subtasks;
-- DROP POLICY IF EXISTS write_assign ON public.task_assignments;
-- CREATE POLICY write_events   ON public.events           FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY write_tasks    ON public.tasks            FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY write_subtasks ON public.subtasks         FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY write_assign   ON public.task_assignments FOR ALL USING (true) WITH CHECK (true);
-- DROP FUNCTION IF EXISTS public.is_committee_member(uuid);
