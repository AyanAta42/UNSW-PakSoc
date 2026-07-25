import { supabase } from '@/core/supabase/client'

export async function deleteMembers(ids: string[]): Promise<void> {
  const { error } = await supabase.from('members').delete().in('id', ids)
  if (error) throw error
}
