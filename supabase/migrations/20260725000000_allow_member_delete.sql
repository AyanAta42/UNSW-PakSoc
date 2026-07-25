-- ── Allow admins to permanently remove members ────────────────────────────
-- 20260724000001 locked members down to UPDATE/INSERT/SELECT only ("No
-- DELETE policy → members cannot be removed through the API"). Manage Roles
-- now has a "Remove Member" flow, so admins need a real DELETE path.
--
-- Reuses is_member_admin() (president or developer) from 20260724000001.
-- task_assignments.member_id has ON DELETE CASCADE, so a removed member's
-- task assignments are cleaned up automatically. This does NOT delete the
-- underlying auth.users row — that requires the Supabase service role and
-- is intentionally out of reach of the anon-key client.

CREATE POLICY members_delete ON public.members
  FOR DELETE TO authenticated
  USING (public.is_member_admin(auth.uid()));

-- ── Rollback (paste to revert) ────────────────────────────────────────────
-- DROP POLICY IF EXISTS members_delete ON public.members;
