import { supabase } from '@/core/supabase/client'

export async function updateTask(id: string, title: string, category: string, notes: string, subtitles: string[]): Promise<void> {
  const { error } = await supabase.from('tasks').update({ title, category, notes }).eq('id', id)
  if (error) throw error
  await supabase.from('subtasks').delete().eq('task_id', id)
  if (subtitles.length) await supabase.from('subtasks').insert(subtitles.map(t => ({ task_id: id, title: t })))
}
