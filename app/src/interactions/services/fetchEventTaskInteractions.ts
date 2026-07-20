import { supabase } from '@/core/supabase/client'
import type { Interaction } from '@/interactions/types/Interaction'

interface InteractionRow extends Interaction { members: { name: string } | null }

/** All task interactions (create/edit/delete/assign) across every task in one event. */
export async function fetchEventTaskInteractions(eventId: string, limit = 100): Promise<Interaction[]> {
  const { data, error } = await supabase
    .from('interactions')
    .select('*, members(name)')
    .eq('entity_type', 'task')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  // See fetchEventInteractions — prefer the member's current name over the stored snapshot.
  return ((data ?? []) as unknown as InteractionRow[]).map(({ members, ...row }) => ({
    ...row,
    actor_name: members?.name ?? row.actor_name,
  }))
}
