import { useState, useEffect } from 'react'
import type { DragEvent, Dispatch, SetStateAction } from 'react'
import type { Task, TaskCategory, Member } from './types'
import { fetchMembers, fetchTasks, createTask, deleteTask, assignMember, unassignMember } from '@/lib/db'

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
  addTask: () => void
  removeTask: (id: string) => void
  removeAssigned: (taskId: string, memberId: string) => void
  dragStart: (e: DragEvent<HTMLDivElement>, memberId: string) => void
  dragOver:  (e: DragEvent<HTMLDivElement>, taskId: string) => void
  dragLeave: (e: DragEvent<HTMLDivElement>) => void
  drop:      (e: DragEvent<HTMLDivElement>, taskId: string) => void
  dropForm:  (e: DragEvent<HTMLDivElement>) => void
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

  // Load members + tasks from DB
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
    // Optimistic update
    const tempId = `temp_${Date.now()}`
    const optimistic: Task = { id: tempId, title: title.trim(), category: cat, notes: notes.trim(), subtasks: subtitleList.map((t, i) => ({ id: `st${i}`, title: t })), assigned: preAssigned }
    setTasks(p => [...p, optimistic])
    setTitle(''); setCat('Task'); setSubtasks(['']); setPreAssigned([]); setNotes('')
    // Persist to DB then replace temp with real row
    try {
      const realId = await createTask(eventId, optimistic.title, cat, optimistic.notes, subtitleList, memberIds)
      setTasks(p => p.map(t => t.id === tempId ? { ...t, id: realId } : t))
    } catch (e) {
      console.error(e)
      setTasks(p => p.filter(t => t.id !== tempId))
    }
  }

  async function removeTask(id: string) {
    setTasks(p => p.filter(t => t.id !== id))
    try { await deleteTask(id) } catch (e) { console.error(e) }
  }

  async function removeAssigned(taskId: string, mId: string) {
    setTasks(p => p.map(t => t.id === taskId ? { ...t, assigned: t.assigned.filter(a => a.id !== mId) } : t))
    try { await unassignMember(taskId, mId) } catch (e) { console.error(e) }
  }

  const dragStart = (e: DragEvent<HTMLDivElement>, mId: string) => {
    e.dataTransfer.setData('mid', mId); e.dataTransfer.effectAllowed = 'copy'
  }
  const dragOver  = (e: DragEvent<HTMLDivElement>, id: string) => { e.preventDefault(); setOverTask(id) }
  const dragLeave = (e: DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverTask(null)
  }
  const drop = async (e: DragEvent<HTMLDivElement>, taskId: string) => {
    e.preventDefault()
    const m = members.find(m => m.id === e.dataTransfer.getData('mid'))
    if (m && !tasks.find(t => t.id === taskId)?.assigned.some(a => a.id === m.id)) {
      setTasks(p => p.map(t => t.id !== taskId ? t : { ...t, assigned: [...t.assigned, m] }))
      try { await assignMember(taskId, m.id) } catch (err) { console.error(err) }
    }
    setOverTask(null)
  }
  const dropForm = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const m = members.find(m => m.id === e.dataTransfer.getData('mid'))
    if (m && !preAssigned.some(a => a.id === m.id)) setPreAssigned(p => [...p, m])
    setOverForm(false)
  }

  return {
    members, tasks, loading,
    title, setTitle, cat, setCat, subtasks, setSubtasks,
    preAssigned, setPreAssigned, notes, setNotes, overTask, overForm, setOverForm,
    addTask, removeTask, removeAssigned, dragStart, dragOver, dragLeave, drop, dropForm,
  }
}
