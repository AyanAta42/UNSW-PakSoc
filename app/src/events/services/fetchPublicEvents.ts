import { supabase } from '@/core/supabase/client'
import type { DbEvent } from '@/events/types/Event'
import { parseTimeline } from '@/events/utils/parseTimeline'

function mapEvent(row: Record<string, unknown>): DbEvent {
  return { ...(row as unknown as DbEvent), timeline: parseTimeline(row.timeline) }
}

/** Columns the public home / cards / detail UI actually need. */
const PUBLIC_EVENT_COLUMNS = [
  'id', 'name', 'time', 'end_time', 'location', 'price', 'public',
  'image_url', 'buttons', 'timeline',
].join(',')

/** Fetches only events marked as public, ordered by time. */
export async function fetchPublicEvents(): Promise<DbEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select(PUBLIC_EVENT_COLUMNS)
    .eq('public', true)
    .order('time')
  if (error) throw error
  return ((data ?? []) as unknown as Record<string, unknown>[]).map(mapEvent)
}
