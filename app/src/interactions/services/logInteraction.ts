import { supabase } from '@/core/supabase/client'
import type { InteractionAction, InteractionEntity } from '@/interactions/types/Interaction'

/**
 * Records one row in the `interactions` audit trail. Never throws — a failed
 * log write must never block or fail the mutation it's describing, so
 * errors are swallowed and reported to the console instead.
 */
export async function logInteraction(
  action:     InteractionAction,
  entityType: InteractionEntity,
  entityId:   string | null,
  eventId:    string | null,
  summary:    string,
): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const authUser = session?.user

    let actorId: string | null = null
    let actorName = 'Unknown'
    if (authUser) {
      const { data: member } = await supabase.from('members').select('id, name').eq('user_id', authUser.id).maybeSingle()
      if (member) { actorId = member.id; actorName = member.name }
      else if (authUser.email) actorName = authUser.email
    }

    const { error } = await supabase.from('interactions').insert({
      actor_id: actorId, actor_name: actorName,
      action, entity_type: entityType, entity_id: entityId, event_id: eventId,
      summary,
    })
    if (error) throw error
  } catch (e) {
    console.error('[logInteraction] failed to record interaction:', e)
  }
}
