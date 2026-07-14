import { supabase } from '@/core/supabase/client'
import type { DbEvent } from '@/events/types/Event'
import { parseTimeline } from '@/events/utils/parseTimeline'

export async function fetchEventById(id: string): Promise<DbEvent | null> {
  const { data, error } = await supabase.from('events').select('*').eq('id', id).single()
  if (error) return null
  return { ...(data as unknown as DbEvent), timeline: parseTimeline(data.timeline) }
}
