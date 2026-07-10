import { supabase } from '@/core/supabase/client'
import type { MemberRole } from '@/members/types/Member'

export async function updateMemberRole(id: string, role: MemberRole): Promise<void> {
  const { error } = await supabase.from('members').update({ role }).eq('id', id)
  if (error) throw error
}
