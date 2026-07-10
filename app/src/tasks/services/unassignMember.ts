import { supabase } from '@/core/supabase/client'

export async function unassignMember(taskId: string, memberId: string): Promise<void> {
  await supabase.from('task_assignments').delete().match({ task_id: taskId, member_id: memberId })
}
