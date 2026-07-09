-- ═══════════════════════════════════════════════════════════════════════════
-- Paste this entire file into:
-- Supabase Dashboard → SQL Editor → New Query → Run
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Tables ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.members (
  id        uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name      text NOT NULL,
  role      text NOT NULL CHECK (role IN ('President','VP','Exec','Subcom')),
  committee text NOT NULL CHECK (committee IN ('Presidents','Sports','Marketing','Events','HR')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.events (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name       text NOT NULL,
  location   text,
  time       timestamptz,
  tag        text DEFAULT 'Social',
  emoji      text DEFAULT '📅',
  public     boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
-- If table already exists, add the column:
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS public boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.tasks (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id   uuid REFERENCES public.events(id) ON DELETE CASCADE,
  title      text NOT NULL,
  category   text NOT NULL CHECK (category IN ('Task','Game','Stall')) DEFAULT 'Task',
  notes      text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subtasks (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id    uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  title      text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.task_assignments (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id    uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  member_id  uuid REFERENCES public.members(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(task_id, member_id)
);

-- ── Row Level Security ────────────────────────────────────────────────────
ALTER TABLE public.members          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_members"  ON public.members          FOR SELECT USING (true);
CREATE POLICY "public_read_events"   ON public.events           FOR SELECT USING (true);
CREATE POLICY "public_read_tasks"    ON public.tasks            FOR SELECT USING (true);
CREATE POLICY "public_read_subtasks" ON public.subtasks         FOR SELECT USING (true);
CREATE POLICY "public_read_assign"   ON public.task_assignments FOR SELECT USING (true);

CREATE POLICY "write_tasks"    ON public.tasks            FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "write_subtasks" ON public.subtasks         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "write_assign"   ON public.task_assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "write_events"   ON public.events           FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "write_members"  ON public.members          FOR ALL USING (true) WITH CHECK (true);

-- ── Seed Events ───────────────────────────────────────────────────────────
INSERT INTO public.events (name, location, time, tag, emoji, public) VALUES
  ('Chai & Chat',      'Mathews Pavilion, UNSW', '2026-06-20 18:00:00+10', 'Social',   '☕', true),
  ('Eid Gala 2026',    'Roundhouse, UNSW',        '2026-06-28 19:00:00+10', 'Flagship', '🌙', true),
  ('Cricket Carnival', 'UNSW Oval, Kensington',   '2026-07-13 10:00:00+10', 'Sports',   '🏏', true)
ON CONFLICT DO NOTHING;

-- ── Seed Members ──────────────────────────────────────────────────────────
INSERT INTO public.members (name, role, committee) VALUES
  ('Usman Farooq',   'President', 'Presidents'),
  ('Hiba Siddiqui',  'VP',        'Presidents'),
  ('Raza Mahmood',   'VP',        'Presidents'),
  ('Ahmed Khan',     'Exec',      'Sports'),
  ('Zara Ali',       'Exec',      'Sports'),
  ('Faisal Ahmed',   'Exec',      'Sports'),
  ('Hassan Malik',   'Subcom',    'Sports'),
  ('Fatima Raza',    'Subcom',    'Sports'),
  ('Bilal Chaudhry', 'Subcom',    'Sports'),
  ('Mariam Qureshi', 'Subcom',    'Sports'),
  ('Asad Baig',      'Subcom',    'Sports'),
  ('Noor Hussain',   'Subcom',    'Sports'),
  ('Sadia Mirza',    'Subcom',    'Sports'),
  ('Junaid Sheikh',  'Subcom',    'Sports'),
  ('Amna Tariq',     'Subcom',    'Sports'),
  ('Umar Iqbal',     'Subcom',    'Sports'),
  ('Rabia Siddiqui', 'Subcom',    'Sports'),
  ('Sara Sheikh',    'Exec',      'Marketing'),
  ('Hamza Farooq',   'Exec',      'Marketing'),
  ('Hasan Raza',     'Exec',      'Marketing'),
  ('Omar Qureshi',   'Subcom',    'Marketing'),
  ('Aisha Baig',     'Subcom',    'Marketing'),
  ('Nadia Ali',      'Subcom',    'Marketing'),
  ('Talha Khan',     'Subcom',    'Marketing'),
  ('Sana Malik',     'Subcom',    'Marketing'),
  ('Zainab Ahmed',   'Subcom',    'Marketing'),
  ('Irfan Hussain',  'Subcom',    'Marketing'),
  ('Nadia Hussain',  'Exec',      'Events'),
  ('Kamran Mirza',   'Exec',      'Events'),
  ('Rizwan Malik',   'Exec',      'Events'),
  ('Layla Rahman',   'Exec',      'Events'),
  ('Imran Siddiqui', 'Subcom',    'Events'),
  ('Ayesha Baig',    'Subcom',    'Events'),
  ('Shahzaib Ali',   'Subcom',    'Events'),
  ('Mehwish Khan',   'Subcom',    'Events'),
  ('Daniyal Raza',   'Subcom',    'Events'),
  ('Farah Qureshi',  'Subcom',    'Events'),
  ('Saira Ahmed',    'Subcom',    'Events'),
  ('Moiz Sheikh',    'Subcom',    'Events'),
  ('Hira Tariq',     'Subcom',    'Events'),
  ('Adnan Hussain',  'Subcom',    'Events'),
  ('Maryam Iqbal',   'Subcom',    'Events'),
  ('Asim Farooq',    'Subcom',    'Events'),
  ('Rubab Siddiqui', 'Subcom',    'Events'),
  ('Waqas Ali',      'Subcom',    'Events'),
  ('Zunera Khan',    'Subcom',    'Events'),
  ('Tariq Iqbal',    'Subcom',    'Events'),
  ('Dua Malik',      'Exec',      'HR'),
  ('Fariha Raza',    'Exec',      'HR'),
  ('Saad Akhtar',    'Subcom',    'HR'),
  ('Maham Iqbal',    'Subcom',    'HR'),
  ('Jawad Sheikh',   'Subcom',    'HR')
ON CONFLICT DO NOTHING;
