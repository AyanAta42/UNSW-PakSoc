-- Paste into Supabase SQL Editor → Run
-- Adds fake timelines to events (only where timeline is empty)

UPDATE public.events SET timeline = '[
  {"time":"15:00","title":"Doors open & registration"},
  {"time":"15:30","title":"Welcome & intro"},
  {"time":"16:00","title":"Kahoot"},
  {"time":"16:45","title":"Food break"},
  {"time":"17:30","title":"Main performances"},
  {"time":"19:00","title":"Closing & photos"}
]'::jsonb
WHERE timeline = '[]'::jsonb OR timeline IS NULL;

-- Optional: custom timelines by event name (overrides generic above)
UPDATE public.events SET timeline = '[
  {"time":"18:00","title":"Doors open"},
  {"time":"18:30","title":"Opening remarks"},
  {"time":"19:00","title":"Cultural performances"},
  {"time":"20:00","title":"Dinner service"},
  {"time":"21:00","title":"DJ & dance floor"},
  {"time":"22:30","title":"Event ends"}
]'::jsonb
WHERE name ILIKE '%raunaq%' OR name ILIKE '%gala%';

UPDATE public.events SET timeline = '[
  {"time":"10:00","title":"Team check-in"},
  {"time":"10:30","title":"Group warm-up"},
  {"time":"11:00","title":"Round 1 matches"},
  {"time":"13:00","title":"Lunch break"},
  {"time":"14:00","title":"Semi-finals"},
  {"time":"16:00","title":"Final & trophy presentation"}
]'::jsonb
WHERE name ILIKE '%cricket%' OR name ILIKE '%khel%' OR name ILIKE '%sport%';

UPDATE public.events SET timeline = '[
  {"time":"17:30","title":"Maghrib & welcome"},
  {"time":"18:00","title":"Iftar begins"},
  {"time":"19:00","title":"Community chat"},
  {"time":"20:00","title":"Games & activities"},
  {"time":"21:00","title":"Wrap up"}
]'::jsonb
WHERE name ILIKE '%iftar%';

-- Verify
SELECT name, timeline FROM public.events ORDER BY time;
