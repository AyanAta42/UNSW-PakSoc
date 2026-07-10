import { supabase } from '@/core/supabase/client'
import type { DbEvent } from '@/events/types/Event'

export async function updateEvent(id: string, fields: Partial<Omit<DbEvent, 'id'>>): Promise<void> {
  const { error } = await supabase.from('events').update(fields).eq('id', id)
  if (error) throw error
}
