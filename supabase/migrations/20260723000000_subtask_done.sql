-- ── Subtask completion flag ───────────────────────────────────────────────
-- Adds a `done` boolean to subtasks so ticking one strikes the text through
-- (it is never deleted). Idempotent — safe to re-run.

ALTER TABLE public.subtasks
  ADD COLUMN IF NOT EXISTS done boolean NOT NULL DEFAULT false;
