-- ── Developer super-role ──────────────────────────────────────────────────
-- A hidden, god-mode flag that sits ALONGSIDE the member's normal display role.
-- When true, the member gets access equal to a President across the whole app,
-- while everyone (including other Presidents) still sees only their normal role.
--
-- There is deliberately NO app UI to set this. Grant it by editing the row
-- directly here:  Supabase Dashboard → Table editor → members → is_developer = true
-- (or: UPDATE public.members SET is_developer = true WHERE email = 'you@example.com';)
--
-- The app never selects this column into any list that gets rendered, and never
-- writes it, so it cannot leak to other users or be toggled from the UI.
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS is_developer boolean NOT NULL DEFAULT false;
