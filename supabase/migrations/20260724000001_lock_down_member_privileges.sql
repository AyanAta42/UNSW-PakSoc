-- ── Server-side privilege lockdown for members ────────────────────────────
-- The app's anon key is public (it ships in the client bundle), so hiding
-- buttons in React is NOT a security boundary: anyone can call the REST API
-- directly. Until now `write_members USING(true)` let any caller set their own
-- role to 'president' (or is_developer = true) from the browser console.
--
-- These policies + trigger make the DATABASE the authority:
--   • a member may edit only their OWN row (in practice: name / avatar)
--   • only a President or developer may change anyone's role / committee
--   • is_developer can be set ONLY by direct DB access (dashboard / service
--     role) — not even a President can flip it through the app
--
-- Presidents are still trusted to manage roles via the UI; this only stops
-- everyone else from doing it behind the UI's back.

-- Who may administer members? SECURITY DEFINER so it reads the table as the
-- owner and does not recurse through the policies defined below.
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

-- Replace the wide-open write policy with scoped ones.
DROP POLICY IF EXISTS write_members       ON public.members;  -- current name
DROP POLICY IF EXISTS public_read_members ON public.members;  -- older name, if present
DROP POLICY IF EXISTS read_members        ON public.members;

-- Reads stay public (the site renders members/committees to everyone).
-- NOTE: is_developer is a column here, so it is technically readable via the
-- raw API. It never leaks in the app UI, but if you want it hidden from raw
-- API queries too, see the follow-up option in the PR/commit notes.
CREATE POLICY read_members ON public.members
  FOR SELECT USING (true);

-- A user may create only their own row, always as a plain public member.
CREATE POLICY members_insert_self ON public.members
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND role = 'public' AND is_developer = false);

-- A user may update their own row; an admin (President/dev) may update anyone's.
-- (Field-level restrictions are enforced by the trigger below.)
CREATE POLICY members_update ON public.members
  FOR UPDATE TO authenticated
  USING      (user_id = auth.uid() OR public.is_member_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_member_admin(auth.uid()));

-- No DELETE policy → members cannot be removed through the API.

-- Field-level guard: the row policy above still lets a normal user touch their
-- OWN row, so block privilege escalation on it, and block even a President from
-- flipping the developer flag through the app.
CREATE OR REPLACE FUNCTION public.members_guard_privileged_fields()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  -- auth.uid() is NULL for direct SQL / service role → those bypass every check,
  -- which is exactly how you grant developer access from the dashboard.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- The developer flag is never settable through the API.
  IF NEW.is_developer IS DISTINCT FROM OLD.is_developer THEN
    RAISE EXCEPTION 'is_developer can only be changed directly in the database';
  END IF;

  -- Only admins may change role / committee (or reassign identity fields).
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

-- ── Rollback (paste to revert) ────────────────────────────────────────────
-- DROP TRIGGER  IF EXISTS members_guard_privileged_fields ON public.members;
-- DROP FUNCTION IF EXISTS public.members_guard_privileged_fields();
-- DROP POLICY   IF EXISTS members_update      ON public.members;
-- DROP POLICY   IF EXISTS members_insert_self ON public.members;
-- CREATE POLICY write_members ON public.members FOR ALL USING (true) WITH CHECK (true);
-- DROP FUNCTION IF EXISTS public.is_member_admin(uuid);
