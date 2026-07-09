import { supabase } from '../supabase'
import type { Member, SubtaskItem, Task } from '@/pages/subcom/data/types'

export async function fetchTasks(eventId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select(`id, title, category, notes, subtasks(id, title), task_assignments(member_id, members(id, name, role, committee))`)
    .eq('event_id', eventId)
    .order('created_at')
  if (error) throw error
  return (data ?? []).map(row => {
    const assignments = (row.task_assignments as unknown as { members: Partial<Member> | Partial<Member>[] | null }[]) ?? []
    return {
      id: row.id,
      title: row.title,
      category: row.category,
      notes: row.notes ?? '',
      subtasks: (row.subtasks as SubtaskItem[]) ?? [],
      assigned: assignments
        .map(a => (Array.isArray(a.members) ? a.members[0] : a.members))
        .filter((m): m is Partial<Member> => !!m)
        .map(m => ({ id: m.id!, name: m.name!, email: m.email ?? '', role: m.role!, committee: m.committee, user_id: m.user_id })),
    }
  })
}

export async function createTask(
  eventId: string,
  title: string,
  category: string,
  notes: string,
  subtitles: string[],
  memberIds: string[],
): Promise<string> {
  const { data: task, error } = await supabase
    .from('tasks')
    .insert({ event_id: eventId, title, category, notes })
    .select('id')
    .single()
  if (error) throw error
  if (subtitles.length) await supabase.from('subtasks').insert(subtitles.map(t => ({ task_id: task.id, title: t })))
  if (memberIds.length) await supabase.from('task_assignments').insert(memberIds.map(mid => ({ task_id: task.id, member_id: mid })))
  return task.id
}

export async function updateTask(
  id: string,
  title: string,
  category: string,
  notes: string,
  subtitles: string[],
): Promise<void> {
  const { error } = await supabase.from('tasks').update({ title, category, notes }).eq('id', id)
  if (error) throw error
  await supabase.from('subtasks').delete().eq('task_id', id)
  if (subtitles.length) await supabase.from('subtasks').insert(subtitles.map(t => ({ task_id: id, title: t })))
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}

export async function assignMember(taskId: string, memberId: string): Promise<void> {
  await supabase.from('task_assignments').upsert({ task_id: taskId, member_id: memberId })
}

export async function unassignMember(taskId: string, memberId: string): Promise<void> {
  await supabase.from('task_assignments').delete().match({ task_id: taskId, member_id: memberId })
}
