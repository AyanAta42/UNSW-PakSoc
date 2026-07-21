import { supabase } from '@/core/supabase/client'

export async function fetchMemberName(userId: string): Promise<string | null> {
  const { data } = await supabase.from('members').select('name').eq('user_id', userId).maybeSingle()
  return data?.name ?? null
}
