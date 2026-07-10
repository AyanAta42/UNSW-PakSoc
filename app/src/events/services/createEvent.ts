import { supabase } from '@/core/supabase/client'
import type { DbEvent, NewEvent } from '@/events/types/Event'
import { parseTimeline } from '@/events/utils/parseTimeline'

export async function createEvent(ev: NewEvent): Promise<DbEvent> {
  const { data, error } = await supabase
    .from('events')
    .insert({ ...ev, timeline: ev.timeline ?? [], tag: '', emoji: '', public: false })
    .select()
    .single()
  if (error) throw error
  return { ...(data as unknown as DbEvent), timeline: parseTimeline(data.timeline) }
}
