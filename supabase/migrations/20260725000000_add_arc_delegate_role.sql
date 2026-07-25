-- ── Add the "Arc Delegate" role ───────────────────────────────────────────
-- Arc Delegate is a standalone role — it doesn't belong to any committee
-- (Events/Marketing/Sports/HR/Presidents) — but carries the same permissions
-- as Executive (create/edit/announce/delete events, write tasks). It must be
-- added everywhere the app enumerates role strings server-side:
--   • the CHECK constraint on members.role
--   • is_event_editor()    (subcom+ — arc_delegate already qualifies via this)
--   • is_event_publisher() (executive+ — arc_delegate needs adding here)
-- is_committee_member() and is_member_admin() need no change: the former
-- already matches "role <> 'public'" and the latter is president-only, and
-- Arc Delegate (like Executive) is not meant to manage roles.

ALTER TABLE public.members DROP CONSTRAINT IF EXISTS members_role_check;
ALTER TABLE public.members ADD CONSTRAINT members_role_check
  CHECK (role IN ('public','subcom','executive','arc_delegate','vice_president','president'));

CREATE OR REPLACE FUNCTION public.is_event_editor(uid uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.members
    WHERE user_id = uid
      AND (role IN ('subcom', 'executive', 'arc_delegate', 'vice_president', 'president')
           OR is_developer = true)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_event_publisher(uid uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.members
    WHERE user_id = uid
      AND (role IN ('executive', 'arc_delegate', 'vice_president', 'president')
           OR is_developer = true)
  );
$$;

-- ── Rollback (paste to revert) ────────────────────────────────────────────
-- ALTER TABLE public.members DROP CONSTRAINT IF EXISTS members_role_check;
-- ALTER TABLE public.members ADD CONSTRAINT members_role_check
--   CHECK (role IN ('public','subcom','executive','vice_president','president'));
-- (then re-apply the CREATE OR REPLACE FUNCTION bodies from
--  20260724000002_lock_down_event_privileges.sql to drop arc_delegate again)
