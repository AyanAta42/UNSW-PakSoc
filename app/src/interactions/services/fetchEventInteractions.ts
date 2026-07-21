import { supabase } from '@/core/supabase/client'
import type { Interaction } from '@/interactions/types/Interaction'

interface InteractionRow extends Interaction { members: { name: string } | null }

/** All event-management interactions (create/edit/delete/publish), across every event. */
export async function fetchEventInteractions(limit = 100): Promise<Interaction[]> {
  const { data, error } = await supabase
    .from('interactions')
    .select('*, members(name)')
    .eq('entity_type', 'event')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  // `actor_name` on the row is a point-in-time snapshot; prefer the member's
  // *current* name (Google Docs shows your latest profile name on old edits too),
  // falling back to the snapshot only if that member record no longer exists.
  return ((data ?? []) as unknown as InteractionRow[]).map(({ members, ...row }) => ({
    ...row,
    actor_name: members?.name ?? row.actor_name,
  }))
}
