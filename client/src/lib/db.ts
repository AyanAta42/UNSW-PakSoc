import { supabase } from './supabase'
import type { Member, Task, SubtaskItem } from '@/pages/subcom/data/types'

// ── Types mirroring DB rows ────────────────────────────────────────────────
export interface DbEvent {
  id: string; name: string; location: string
  time: string; tag: string; emoji: string
}

// ── Members ───────────────────────────────────────────────────────────────
export async function fetchMembers(): Promise<Member[]> {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('committee')
  if (error) throw error
  return (data ?? []).map(r => ({ id: r.id, name: r.name, role: r.role, committee: r.committee }))
}

// ── Events ────────────────────────────────────────────────────────────────
export async function fetchEvents(): Promise<DbEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('time')
  if (error) throw error
  return data ?? []
}

// ── Tasks (with subtasks + assigned members) ──────────────────────────────
export async function fetchTasks(eventId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select(`id, title, category, notes, subtasks(id, title), task_assignments(member_id, members(id, name, role, committee))`)
    .eq('event_id', eventId)
    .order('created_at')
  if (error) throw error
  return (data ?? []).map(row => ({
    id:       row.id,
    title:    row.title,
    category: row.category,
    notes:    row.notes ?? '',
    subtasks: (row.subtasks as SubtaskItem[]) ?? [],
    assigned: (row.task_assignments as {members: Member}[]).map(a => a.members),
  }))
}

// ── Create task ───────────────────────────────────────────────────────────
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

  if (subtitles.length) {
    await supabase.from('subtasks').insert(subtitles.map(t => ({ task_id: task.id, title: t })))
  }
  if (memberIds.length) {
    await supabase.from('task_assignments').insert(memberIds.map(mid => ({ task_id: task.id, member_id: mid })))
  }
  return task.id
}

// ── Delete task ───────────────────────────────────────────────────────────
export async function deleteTask(id: string) {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}

// ── Assign / unassign member ──────────────────────────────────────────────
export async function assignMember(taskId: string, memberId: string) {
  await supabase.from('task_assignments').upsert({ task_id: taskId, member_id: memberId })
}

export async function unassignMember(taskId: string, memberId: string) {
  await supabase.from('task_assignments').delete().match({ task_id: taskId, member_id: memberId })
}
