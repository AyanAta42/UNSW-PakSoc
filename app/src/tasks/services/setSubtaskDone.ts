import { supabase } from '@/core/supabase/client'

/** Toggle a subtask's completion flag. Text is kept — only struck through. */
export async function setSubtaskDone(id: string, done: boolean): Promise<void> {
  const { error } = await supabase.from('subtasks').update({ done }).eq('id', id)
  if (error) throw error
}
