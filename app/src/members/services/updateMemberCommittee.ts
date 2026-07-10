import { supabase } from '@/core/supabase/client'
import type { Committee } from '@/members/types/Member'

export async function updateMemberCommittee(id: string, committee: Committee | null): Promise<void> {
  const { error } = await supabase.from('members').update({ committee }).eq('id', id)
  if (error) throw error
}
