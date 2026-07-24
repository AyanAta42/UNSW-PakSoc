-- ═══════════════════════════════════════════════════════════════════════
-- Paste into Supabase Dashboard → SQL Editor → Run
-- This replaces the old hardcoded members table with auth-linked members
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Drop old members (cascades to task_assignments)
DROP TABLE IF EXISTS public.task_assignments CASCADE;
DROP TABLE IF EXISTS public.members CASCADE;

-- 2. New members table linked to auth users
CREATE TABLE public.members (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email      text NOT NULL,
  name       text,
  avatar_url text,
  role       text NOT NULL DEFAULT 'public'
               CHECK (role IN ('public','subcom','executive','vice_president','president')),
  -- Hidden god-mode flag, separate from the display role above. Grant only by
  -- editing the row directly (never exposed in or writable from the app UI).
  is_developer boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 3. Recreate task_assignments
CREATE TABLE public.task_assignments (
  id        uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id   uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  member_id uuid REFERENCES public.members(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(task_id, member_id)
);

-- 4. RLS
ALTER TABLE public.members          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_members"  ON public.members          FOR SELECT USING (true);
CREATE POLICY "write_members" ON public.members          FOR ALL    USING (true) WITH CHECK (true);
CREATE POLICY "read_assign"   ON public.task_assignments FOR SELECT USING (true);
CREATE POLICY "write_assign"  ON public.task_assignments FOR ALL    USING (true) WITH CHECK (true);

-- 5. Trigger: auto-insert member when a user signs up / logs in via OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.members (user_id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
