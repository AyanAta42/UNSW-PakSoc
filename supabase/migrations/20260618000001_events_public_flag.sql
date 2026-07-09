-- Add public visibility flag to events (default false = draft)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS public boolean NOT NULL DEFAULT false;
