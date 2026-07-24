-- ── Server-side privilege lockdown for events ──────────────────────────────
-- Same reasoning as the members lockdown (20260724000001): the anon key is
-- public, so hiding buttons in React is NOT a security boundary — anyone can
-- POST to the REST API directly. Until now `write_events FOR ALL USING(true)`
-- let any caller create, edit, announce (flip `public`), or delete any event.
--
-- New rule set (matches usePermissions in the app):
--   • Subcom and above may CREATE and EDIT events (drafts).
--   • Only Executive and above may ANNOUNCE / UNANNOUNCE (toggle `public`)
--     or DELETE an event.
--   • Direct DB access (dashboard / service role, where auth.uid() IS NULL)
--     bypasses every check.

-- Who may create / edit events? SECURITY DEFINER so it reads members as the
-- owner and does not recurse through the events policies below.
CREATE OR REPLACE FUNCTION public.is_event_editor(uid uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.members
    WHERE user_id = uid
      AND (role IN ('subcom', 'executive', 'vice_president', 'president')
           OR is_developer = true)
  );
$$;

-- Who may announce/unannounce and delete? Executive and above (or developer).
CREATE OR REPLACE FUNCTION public.is_event_publisher(uid uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.members
    WHERE user_id = uid
      AND (role IN ('executive', 'vice_president', 'president')
           OR is_developer = true)
  );
$$;

-- Replace the wide-open write policy with scoped ones. Reads stay public.
DROP POLICY IF EXISTS write_events       ON public.events;
DROP POLICY IF EXISTS public_read_events ON public.events;

CREATE POLICY public_read_events ON public.events
  FOR SELECT USING (true);

-- Editors (subcom+) may create and edit. The publish guard below stops a
-- non-publisher from announcing via either path.
CREATE POLICY events_insert ON public.events
  FOR INSERT TO authenticated
  WITH CHECK (public.is_event_editor(auth.uid()));

CREATE POLICY events_update ON public.events
  FOR UPDATE TO authenticated
  USING      (public.is_event_editor(auth.uid()))
  WITH CHECK (public.is_event_editor(auth.uid()));

-- Only publishers (executive+) may delete.
CREATE POLICY events_delete ON public.events
  FOR DELETE TO authenticated
  USING (public.is_event_publisher(auth.uid()));

-- Field-level guard: the UPDATE policy lets a subcom edit an event, so block
-- them from flipping `public` (announce/unannounce), and stop a subcom from
-- creating an already-announced event on INSERT.
CREATE OR REPLACE FUNCTION public.events_guard_publish()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  -- auth.uid() is NULL for direct SQL / service role → those bypass the check.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.public AND NOT public.is_event_publisher(auth.uid()) THEN
      RAISE EXCEPTION 'not authorized to announce an event';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.public IS DISTINCT FROM OLD.public
       AND NOT public.is_event_publisher(auth.uid()) THEN
      RAISE EXCEPTION 'not authorized to announce or unannounce an event';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS events_guard_publish ON public.events;
CREATE TRIGGER events_guard_publish
  BEFORE INSERT OR UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.events_guard_publish();

-- ── Rollback (paste to revert) ────────────────────────────────────────────
-- DROP TRIGGER  IF EXISTS events_guard_publish ON public.events;
-- DROP FUNCTION IF EXISTS public.events_guard_publish();
-- DROP POLICY   IF EXISTS events_delete ON public.events;
-- DROP POLICY   IF EXISTS events_update ON public.events;
-- DROP POLICY   IF EXISTS events_insert ON public.events;
-- DROP FUNCTION IF EXISTS public.is_event_publisher(uuid);
-- DROP FUNCTION IF EXISTS public.is_event_editor(uuid);
-- CREATE POLICY write_events ON public.events FOR ALL USING (true) WITH CHECK (true);
