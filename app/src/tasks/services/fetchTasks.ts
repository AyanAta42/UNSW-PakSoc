import { supabase } from '@/core/supabase/client'
import type { Task } from '@/tasks/types/Task'
import type { Member } from '@/members/types/Member'

export async function fetchTasks(eventId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select(`id, title, category, notes, subtasks(id, title, done), task_assignments(member_id, members(id, user_id, name, role, committee))`)
    .eq('event_id', eventId)
    .order('created_at')
    // Keep subtask order stable across refetches (e.g. after a done-toggle).
    // id tiebreaks rows inserted in the same batch (identical created_at).
    .order('created_at', { referencedTable: 'subtasks' })
    .order('id', { referencedTable: 'subtasks' })
  if (error) throw error
  return (data ?? []).map(row => {
    const assignments = (row.task_assignments as unknown as { members: Partial<Member> | Partial<Member>[] | null }[]) ?? []
    return {
      id: row.id, title: row.title, category: row.category,
      notes: row.notes ?? '',
      subtasks: ((row.subtasks as { id: string; title: string; done: boolean }[]) ?? [])
        .map(s => ({ id: s.id, title: s.title, done: s.done ?? false })),
      assigned: assignments
        .map(a => (Array.isArray(a.members) ? a.members[0] : a.members))
        .filter((m): m is Partial<Member> => !!m)
        .map(m => ({ id: m.id!, name: m.name!, email: m.email ?? '', role: m.role!, committee: m.committee, user_id: m.user_id })),
    }
  })
}
