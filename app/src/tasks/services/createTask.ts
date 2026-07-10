import { supabase } from '@/core/supabase/client'

export async function createTask(
  eventId: string,
  title:   string,
  category:string,
  notes:   string,
  subtitles: string[],
  memberIds: string[],
): Promise<string> {
  const { data: task, error } = await supabase
    .from('tasks').insert({ event_id: eventId, title, category, notes }).select('id').single()
  if (error) throw error
  if (subtitles.length) await supabase.from('subtasks').insert(subtitles.map(t => ({ task_id: task.id, title: t })))
  if (memberIds.length) await supabase.from('task_assignments').insert(memberIds.map(mid => ({ task_id: task.id, member_id: mid })))
  return task.id
}
