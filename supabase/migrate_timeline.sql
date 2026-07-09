-- Paste into Supabase SQL Editor → Run
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS timeline jsonb NOT NULL DEFAULT '[]'::jsonb;
