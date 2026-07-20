import { supabase } from '@/core/supabase/client'
import type { Interaction } from '@/interactions/types/Interaction'

/** All event-management interactions (create/edit/delete/publish), across every event. */
export async function fetchEventInteractions(limit = 100): Promise<Interaction[]> {
  const { data, error } = await supabase
    .from('interactions')
    .select('*')
    .eq('entity_type', 'event')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as Interaction[]
}
