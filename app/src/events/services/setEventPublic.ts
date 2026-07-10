import { supabase } from '@/core/supabase/client'

export async function setEventPublic(id: string, value: boolean): Promise<void> {
  const { error } = await supabase.from('events').update({ public: value }).eq('id', id)
  if (error) throw error
}
