import { useState, useEffect, useRef } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { Task, TaskCategory, Member } from './types'
import { fetchMembers, fetchTasks, createTask, deleteTask, assignMember, unassignMember, updateTask } from '@/lib/db'

function findDropTarget(x: number, y: number) {
  const el = document.elementFromPoint(x, y)
  if (!el) return null
  const taskEl = el.closest('[data-task-id]') as HTMLElement | null
  if (taskEl?.dataset.taskId) return { type: 'task' as const, id: taskEl.dataset.taskId }
  if (el.closest('[data-drop-form]')) return { type: 'form' as const }
  return null
}

export interface TaskBoardState {
  members: Member[]
  tasks: Task[]
  loading: boolean
  title: string;       setTitle:       Dispatch<SetStateAction<string>>
  cat: TaskCategory;   setCat:         Dispatch<SetStateAction<TaskCategory>>
  subtasks: string[];  setSubtasks:    Dispatch<SetStateAction<string[]>>
  preAssigned: Member[];setPreAssigned: Dispatch<SetStateAction<Member[]>>
  notes: string;       setNotes:       Dispatch<SetStateAction<string>>
  overTask: string | null
  overForm: boolean;   setOverForm:    Dispatch<SetStateAction<boolean>>
  draggingMemberId: string | null
  addTask: () => void
  removeTask: (id: string) => void
  editTask: (id: string, title: string, cat: TaskCategory, notes: string, subtitles: string[]) => void
  removeAssigned: (taskId: string, memberId: string) => void
  beginMemberDrag: (memberId: string) => void
  moveMemberDrag: (clientX: number, clientY: number) => void
  endMemberDrag: (clientX: number, clientY: number) => void
  assignMemberToTask: (taskId: string, memberId: string) => void
}

export function useTaskBoard(eventId: string): TaskBoardState {
  const [members, setMembers]         = useState<Member[]>([])
  const [tasks, setTasks]             = useState<Task[]>([])
  const [loading, setLoading]         = useState(true)
  const [title, setTitle]             = useState('')
  const [cat, setCat]                 = useState<TaskCategory>('Task')
  const [subtasks, setSubtasks]       = useState<string[]>([''])
  const [preAssigned, setPreAssigned] = useState<Member[]>([])
  const [notes, setNotes]             = useState('')
  const [overTask, setOverTask]       = useState<string | null>(null)
  const [overForm, setOverForm]       = useState(false)
  const [draggingMemberId, setDraggingMemberId] = useState<string | null>(null)
  const draggingRef = useRef<string | null>(null)

  useEffect(() => {
    if (!draggingMemberId) return
    document.body.style.cursor = 'grabbing'
    return () => { document.body.style.cursor = '' }
  }, [draggingMemberId])

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchMembers(), fetchTasks(eventId)])
      .then(([m, t]) => { setMembers(m); setTasks(t) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [eventId])

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
    } catch (e) {
      console.error(e)
      setTasks(p => p.filter(t => t.id !== tempId))
    }
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

  const beginMemberDrag = (memberId: string) => {
    draggingRef.current = memberId
    setDraggingMemberId(memberId)
  }

  const moveMemberDrag = (clientX: number, clientY: number) => {
    const target = findDropTarget(clientX, clientY)
    if (target?.type === 'task') {
      setOverTask(target.id)
      setOverForm(false)
    } else if (target?.type === 'form') {
      setOverTask(null)
      setOverForm(true)
    } else {
      setOverTask(null)
      setOverForm(false)
    }
  }

  const endMemberDrag = async (clientX: number, clientY: number) => {
    const memberId = draggingRef.current
    if (!memberId) return

    const m = members.find(mem => mem.id === memberId)
    const target = findDropTarget(clientX, clientY)

    if (m && target?.type === 'task') {
      const taskId = target.id
      if (!tasks.find(t => t.id === taskId)?.assigned.some(a => a.id === m.id)) {
        setTasks(p => p.map(t => t.id !== taskId ? t : { ...t, assigned: [...t.assigned, m] }))
        try { await assignMember(taskId, m.id) } catch (err) { console.error(err) }
      }
    } else if (m && target?.type === 'form') {
      if (!preAssigned.some(a => a.id === m.id)) setPreAssigned(p => [...p, m])
    }

    draggingRef.current = null
    setDraggingMemberId(null)
    setOverTask(null)
    setOverForm(false)
  }

  const assignMemberToTask = async (taskId: string, memberId: string) => {
    const m = members.find(mem => mem.id === memberId)
    if (!m) return
    if (tasks.find(t => t.id === taskId)?.assigned.some(a => a.id === m.id)) return
    setTasks(p => p.map(t => t.id !== taskId ? t : { ...t, assigned: [...t.assigned, m] }))
    try { await assignMember(taskId, m.id) } catch (err) { console.error(err) }
  }

  return {
    members, tasks, loading,
    title, setTitle, cat, setCat, subtasks, setSubtasks,
    preAssigned, setPreAssigned, notes, setNotes, overTask, overForm, setOverForm,
    draggingMemberId,
    addTask, editTask, removeTask, removeAssigned,
    beginMemberDrag, moveMemberDrag, endMemberDrag,
    assignMemberToTask,
  }
}
