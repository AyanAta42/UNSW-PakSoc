-- ═══════════════════════════════════════════════════════════════════════════
-- One-shot security lockdown — paste the WHOLE file into:
--   Supabase Dashboard → SQL Editor → New Query → Run
-- Idempotent: safe to run more than once. Equivalent to migrations
-- 20260724000000 / 000001 / 000002 combined, in order.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Developer flag ──────────────────────────────────────────────────────
-- Hidden god-mode flag alongside the normal display role. Grant it ONLY by
-- editing the row directly (see the last line of this file). No app UI writes it.
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS is_developer boolean NOT NULL DEFAULT false;

-- ── 2. Members: lock down role / privilege changes ─────────────────────────
CREATE OR REPLACE FUNCTION public.is_member_admin(uid uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.members
    WHERE user_id = uid
      AND (role = 'president' OR is_developer = true)
  );
$$;

DROP POLICY IF EXISTS write_members       ON public.members;
DROP POLICY IF EXISTS public_read_members ON public.members;
DROP POLICY IF EXISTS read_members        ON public.members;

-- Reads stay public (site renders members/committees to everyone).
CREATE POLICY read_members ON public.members
  FOR SELECT USING (true);

-- A user may create only their own row, always as a plain public member.
CREATE POLICY members_insert_self ON public.members
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND role = 'public' AND is_developer = false);

-- A user may update their own row; an admin (President/dev) may update anyone's.
CREATE POLICY members_update ON public.members
  FOR UPDATE TO authenticated
  USING      (user_id = auth.uid() OR public.is_member_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_member_admin(auth.uid()));
-- (No DELETE policy → members can't be removed through the API.)

-- Field-level guard: block privilege escalation on your own row, and block even
-- a President from flipping the developer flag through the app.
CREATE OR REPLACE FUNCTION public.members_guard_privileged_fields()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  -- auth.uid() is NULL for direct SQL / service role → those bypass every check.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.is_developer IS DISTINCT FROM OLD.is_developer THEN
    RAISE EXCEPTION 'is_developer can only be changed directly in the database';
  END IF;

  IF NOT public.is_member_admin(auth.uid()) AND (
        NEW.role      IS DISTINCT FROM OLD.role
     OR NEW.committee IS DISTINCT FROM OLD.committee
     OR NEW.user_id   IS DISTINCT FROM OLD.user_id
     OR NEW.email     IS DISTINCT FROM OLD.email
  ) THEN
    RAISE EXCEPTION 'not authorized to change role or committee';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS members_guard_privileged_fields ON public.members;
CREATE TRIGGER members_guard_privileged_fields
  BEFORE UPDATE ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.members_guard_privileged_fields();

-- ── 3. Events / tasks: only committee members may write ────────────────────
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

DROP POLICY IF EXISTS write_events ON public.events;
CREATE POLICY write_events ON public.events
  FOR ALL TO authenticated
  USING (public.is_committee_member(auth.uid())) WITH CHECK (public.is_committee_member(auth.uid()));

DROP POLICY IF EXISTS write_tasks ON public.tasks;
CREATE POLICY write_tasks ON public.tasks
  FOR ALL TO authenticated
  USING (public.is_committee_member(auth.uid())) WITH CHECK (public.is_committee_member(auth.uid()));

DROP POLICY IF EXISTS write_subtasks ON public.subtasks;
CREATE POLICY write_subtasks ON public.subtasks
  FOR ALL TO authenticated
  USING (public.is_committee_member(auth.uid())) WITH CHECK (public.is_committee_member(auth.uid()));

DROP POLICY IF EXISTS write_assign ON public.task_assignments;
CREATE POLICY write_assign ON public.task_assignments
  FOR ALL TO authenticated
  USING (public.is_committee_member(auth.uid())) WITH CHECK (public.is_committee_member(auth.uid()));

-- ── 4. Grant YOURSELF developer access (edit the email, then it runs) ──────
UPDATE public.members SET is_developer = true WHERE email = 'you@example.com';
