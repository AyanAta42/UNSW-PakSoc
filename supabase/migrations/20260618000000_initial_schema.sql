-- ── Members (committee members) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.members (
  id        uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name      text NOT NULL,
  role      text NOT NULL CHECK (role IN ('President','VP','Exec','Subcom')),
  committee text NOT NULL CHECK (committee IN ('Presidents','Sports','Marketing','Events','HR')),
  created_at timestamptz DEFAULT now()
);

-- ── Events ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.events (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name       text NOT NULL,
  location   text,
  time       timestamptz,
  tag        text DEFAULT 'Social',
  emoji      text DEFAULT '📅',
  created_at timestamptz DEFAULT now()
);

-- ── Tasks ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tasks (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id   uuid REFERENCES public.events(id) ON DELETE CASCADE,
  title      text NOT NULL,
  category   text NOT NULL CHECK (category IN ('Task','Game','Stall')) DEFAULT 'Task',
  notes      text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- ── Subtasks ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subtasks (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id    uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  title      text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ── Task Assignments (member ↔ task) ──────────────────────────────────────
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

-- Public read (events + members visible to everyone)
CREATE POLICY "public_read_members"  ON public.members          FOR SELECT USING (true);
CREATE POLICY "public_read_events"   ON public.events           FOR SELECT USING (true);
CREATE POLICY "public_read_tasks"    ON public.tasks            FOR SELECT USING (true);
CREATE POLICY "public_read_subtasks" ON public.subtasks         FOR SELECT USING (true);
CREATE POLICY "public_read_assign"   ON public.task_assignments FOR SELECT USING (true);

-- Write access (open for now — tighten when auth is added)
CREATE POLICY "write_tasks"    ON public.tasks            FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "write_subtasks" ON public.subtasks         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "write_assign"   ON public.task_assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "write_events"   ON public.events           FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "write_members"  ON public.members          FOR ALL USING (true) WITH CHECK (true);
