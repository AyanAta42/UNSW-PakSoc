import { supabase } from '@/core/supabase/client'
import type { DbEvent } from '@/events/types/Event'
import { parseTimeline } from '@/events/utils/parseTimeline'

function mapEvent(row: Record<string, unknown>): DbEvent {
  return { ...(row as unknown as DbEvent), timeline: parseTimeline(row.timeline) }
}

/** Fetches only events marked as public, ordered by time. */
export async function fetchPublicEvents(): Promise<DbEvent[]> {
  const { data, error } = await supabase.from('events').select('*').eq('public', true).order('time')
  if (error) throw error
  return (data ?? []).map(mapEvent)
}
