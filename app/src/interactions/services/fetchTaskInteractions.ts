import { supabase } from '@/core/supabase/client'
import type { Interaction } from '@/interactions/types/Interaction'

/** Interactions scoped to a single task (edits, assignments, deletion). */
export async function fetchTaskInteractions(taskId: string, limit = 100): Promise<Interaction[]> {
  const { data, error } = await supabase
    .from('interactions')
    .select('*')
    .eq('entity_type', 'task')
    .eq('entity_id', taskId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as Interaction[]
}
