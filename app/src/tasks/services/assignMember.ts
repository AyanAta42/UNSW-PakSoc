import { supabase } from '@/core/supabase/client'

export async function assignMember(taskId: string, memberId: string): Promise<void> {
  await supabase.from('task_assignments').upsert({ task_id: taskId, member_id: memberId })
}
