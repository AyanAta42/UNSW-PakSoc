import { useState, useEffect } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { Task } from '@/tasks/types/Task'
import type { Member } from '@/members/types/Member'
import { fetchMembers }    from '@/members/services/fetchMembers'
import { fetchTasks }      from '@/tasks/services/fetchTasks'
import { fetchEventById }  from '@/events/services/fetchEventById'
import { updateEvent }       from '@/events/services/updateEvent'
import { createTask }      from '@/tasks/services/createTask'
import { updateTask }      from '@/tasks/services/updateTask'
import { deleteTask }      from '@/tasks/services/deleteTask'
import { unassignMember }  from '@/tasks/services/unassignMember'
import { useDragAssign }   from '@/tasks/hooks/useDragAssign'
import type { DragAssignState } from '@/tasks/hooks/useDragAssign'
import { DEFAULT_TASK_CATEGORIES } from '@/tasks/types/Task'

export interface TaskBoardState extends DragAssignState {
  members:         Member[];  tasks:          Task[];          loading:        boolean
  title:           string;    setTitle:       Dispatch<SetStateAction<string>>
  cat:             string;    setCat:         Dispatch<SetStateAction<string>>
  subtasks:        string[];  setSubtasks:    Dispatch<SetStateAction<string[]>>
  preAssigned:     Member[];  setPreAssigned: Dispatch<SetStateAction<Member[]>>
  notes:           string;    setNotes:       Dispatch<SetStateAction<string>>
  allCategories:   string[]
  selectedMemberId: string | null
  selectMember:    (id: string | null) => void
  addCustomCategory:    (name: string) => void
  removeCustomCategory: (name: string) => void
  addTask:         () => void
  removeTask:      (id: string) => void
  editTask:        (id: string, title: string, cat: string, notes: string, subs: string[]) => void
  removeAssigned:  (taskId: string, memberId: string) => void
}

export function useTaskBoard(eventId: string): TaskBoardState {
  const [members,  setMembers]  = useState<Member[]>([])
  const [tasks,    setTasks]    = useState<Task[]>([])
  const [loading,  setLoading]  = useState(true)
  const [title,    setTitle]    = useState('')
  const [cat,      setCat]      = useState<string>('Task')
  const [subtasks, setSubtasks] = useState<string[]>([''])
  const [preAssigned, setPreAssigned] = useState<Member[]>([])
  const [notes,    setNotes]    = useState('')
  const [customCats, setCustomCats] = useState<string[]>([])
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchMembers(), fetchTasks(eventId), fetchEventById(eventId)])
      .then(([m, t, ev]) => {
        setMembers(m); setTasks(t)
        setCustomCats(ev?.custom_categories ?? [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [eventId])

  const drag = useDragAssign(members, tasks, setTasks, preAssigned, setPreAssigned)

  const allCategories = [...DEFAULT_TASK_CATEGORIES, ...customCats.filter(c => !DEFAULT_TASK_CATEGORIES.includes(c))]

  function selectMember(id: string | null) { setSelectedMemberId(id) }

  async function persistCategories(next: string[]) {
    setCustomCats(next)
    try { await updateEvent(eventId, { custom_categories: next }) } catch (e) { console.error(e) }
  }

  function addCustomCategory(name: string) {
    const v = name.trim()
    if (!v || allCategories.includes(v)) return
    persistCategories([...customCats, v])
  }

  function removeCustomCategory(name: string) {
    persistCategories(customCats.filter(c => c !== name))
    if (cat === name) setCat('Task')
  }

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

  async function editTask(id: string, title: string, cat: string, notes: string, subtitles: string[]) {
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

  return { members, tasks, loading, title, setTitle, cat, setCat, subtasks, setSubtasks, preAssigned, setPreAssigned, notes, setNotes, allCategories, selectedMemberId, selectMember, addCustomCategory, removeCustomCategory, addTask, editTask, removeTask, removeAssigned, ...drag }
}
