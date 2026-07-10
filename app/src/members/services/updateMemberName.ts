import { supabase } from '@/core/supabase/client'

export async function updateMemberName(userId: string, name: string): Promise<void> {
  const { error } = await supabase.from('members').update({ name }).eq('user_id', userId)
  if (error) throw error
}
