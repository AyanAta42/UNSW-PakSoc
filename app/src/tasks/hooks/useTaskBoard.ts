import { useState, useEffect } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { Task, TaskCategory } from '@/tasks/types/Task'
import type { Member } from '@/members/types/Member'
import { fetchMembers }   from '@/members/services/fetchMembers'
import { fetchTasks }     from '@/tasks/services/fetchTasks'
import { createTask }     from '@/tasks/services/createTask'
import { updateTask }     from '@/tasks/services/updateTask'
import { deleteTask }     from '@/tasks/services/deleteTask'
import { unassignMember } from '@/tasks/services/unassignMember'
import { useDragAssign }  from '@/tasks/hooks/useDragAssign'
import type { DragAssignState } from '@/tasks/hooks/useDragAssign'

export interface TaskBoardState extends DragAssignState {
  members: Member[];   tasks:        Task[];        loading:       boolean
  title:   string;     setTitle:     Dispatch<SetStateAction<string>>
  cat:     TaskCategory; setCat:     Dispatch<SetStateAction<TaskCategory>>
  subtasks: string[];  setSubtasks:  Dispatch<SetStateAction<string[]>>
  preAssigned: Member[]; setPreAssigned: Dispatch<SetStateAction<Member[]>>
  notes:   string;     setNotes:     Dispatch<SetStateAction<string>>
  addTask:    () => void
  removeTask: (id: string) => void
  editTask:   (id: string, title: string, cat: TaskCategory, notes: string, subs: string[]) => void
  removeAssigned: (taskId: string, memberId: string) => void
}

/** Orchestrates data loading, CRUD operations, and drag-assign for the task board. */
export function useTaskBoard(eventId: string): TaskBoardState {
  const [members, setMembers]         = useState<Member[]>([])
  const [tasks, setTasks]             = useState<Task[]>([])
  const [loading, setLoading]         = useState(true)
  const [title, setTitle]             = useState('')
  const [cat, setCat]                 = useState<TaskCategory>('Task')
  const [subtasks, setSubtasks]       = useState<string[]>([''])
  const [preAssigned, setPreAssigned] = useState<Member[]>([])
  const [notes, setNotes]             = useState('')

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchMembers(), fetchTasks(eventId)])
      .then(([m, t]) => { setMembers(m); setTasks(t) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [eventId])

  const drag = useDragAssign(members, tasks, setTasks, preAssigned, setPreAssigned)

  async function addTask() {
    if (!title.trim()) return
    const subtitleList = subtasks.filter(s => s.trim())
    const memberIds    = preAssigned.map(m => m.id)
    const tempId = `temp_${Date.now()}`
    const optimistic: Task = { id: tempId, title: title.trim(), category: cat, notes: notes.trim(), subtasks: subtitleList.map((t, i) => ({ id: `st${i}`, title: t })), assigned: preAssigned }
    setTasks(p => [...p, optimistic])
    setTitle(''); setCat('Task'); setSubtasks(['']); setPreAssigned([]); setNotes('')
    try {
      const realId = await createTask(eventId, optimistic.title, cat, optimistic.notes, subtitleList, memberIds)
      setTasks(p => p.map(t => t.id === tempId ? { ...t, id: realId } : t))
    } catch (e) { console.error(e); setTasks(p => p.filter(t => t.id !== tempId)) }
  }

  async function editTask(id: string, title: string, cat: TaskCategory, notes: string, subtitles: string[]) {
    const newSubs = subtitles.map((t, i) => ({ id: `st_${i}`, title: t }))
    setTasks(p => p.map(t => t.id !== id ? t : { ...t, title, category: cat, notes, subtasks: newSubs }))
    try { await updateTask(id, title, cat, notes, subtitles) } catch (e) { console.error(e) }
  }

  async function removeTask(id: string) {
    setTasks(p => p.filter(t => t.id !== id))
    try { await deleteTask(id) } catch (e) { console.error(e) }
  }

  async function removeAssigned(taskId: string, mId: string) {
    setTasks(p => p.map(t => t.id === taskId ? { ...t, assigned: t.assigned.filter(a => a.id !== mId) } : t))
    try { await unassignMember(taskId, mId) } catch (e) { console.error(e) }
  }

  return { members, tasks, loading, title, setTitle, cat, setCat, subtasks, setSubtasks, preAssigned, setPreAssigned, notes, setNotes, addTask, editTask, removeTask, removeAssigned, ...drag }
}
