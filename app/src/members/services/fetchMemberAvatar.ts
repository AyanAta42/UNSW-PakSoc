import { supabase } from '@/core/supabase/client'

export async function fetchMemberAvatar(userId: string): Promise<string | null> {
  const { data } = await supabase.from('members').select('avatar_url').eq('user_id', userId).single()
  return data?.avatar_url ?? null
}
