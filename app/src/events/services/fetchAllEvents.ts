import { supabase } from '@/core/supabase/client'
import type { DbEvent } from '@/events/types/Event'
import { parseTimeline } from '@/events/utils/parseTimeline'

function mapEvent(row: Record<string, unknown>): DbEvent {
  return { ...(row as unknown as DbEvent), timeline: parseTimeline(row.timeline) }
}

/** Fetches all events (public + drafts) for the admin events manager. */
export async function fetchAllEvents(): Promise<DbEvent[]> {
  const { data, error } = await supabase.from('events').select('*').order('time')
  if (error) throw error
  return (data ?? []).map(mapEvent)
}
