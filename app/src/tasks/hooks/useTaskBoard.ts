import { useState, useEffect } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { Task } from '@/tasks/types/Task'
import type { Member } from '@/members/types/Member'
import { supabase }       from '@/core/supabase/client'
import { fetchMembers }    from '@/members/services/fetchMembers'
import { fetchTasks }      from '@/tasks/services/fetchTasks'
import { fetchEventById }  from '@/events/services/fetchEventById'
import { updateEvent }     from '@/events/services/updateEvent'
import { createTask }      from '@/tasks/services/createTask'
import { updateTask }      from '@/tasks/services/updateTask'
import { deleteTask }      from '@/tasks/services/deleteTask'
import { unassignMember }  from '@/tasks/services/unassignMember'
import { useDragAssign }   from '@/tasks/hooks/useDragAssign'
import type { DragAssignState } from '@/tasks/hooks/useDragAssign'
import { useRealtimeTable } from '@/core/supabase/useRealtimeTable'
import { logInteraction }  from '@/interactions/services/logInteraction'
import { DEFAULT_TASK_CATEGORIES } from '@/tasks/types/Task'
import { toast, errorMessage } from '@/shared/toast/toast'

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
        setMembers(m.filter(x => x.role !== 'public')); setTasks(t)
        // Only set from DB on initial load — don't overwrite if user already added categories
        setCustomCats(prev => prev.length > 0 ? prev : (ev?.custom_categories ?? []))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [eventId])

  // Live updates from other subcom members editing the same board
  useRealtimeTable(['tasks', 'subtasks', 'task_assignments'], () => {
    fetchTasks(eventId).then(setTasks).catch(console.error)
  }, !loading)

  const drag = useDragAssign(members, tasks, setTasks, preAssigned, setPreAssigned, eventId)

  const allCategories = [...DEFAULT_TASK_CATEGORIES, ...customCats.filter(c => !DEFAULT_TASK_CATEGORIES.includes(c))]

  function selectMember(id: string | null) { setSelectedMemberId(id) }

  function addCustomCategory(name: string) {
    const v = name.trim()
    if (!v) return
    // Use current snapshot to avoid stale-closure duplicates
    setCustomCats(prev => {
      const all = [...DEFAULT_TASK_CATEGORIES, ...prev]
      if (all.includes(v)) return prev
      const next = [...prev, v]
      // Fire-and-forget persistence after state is confirmed updated
      updateEvent(eventId, { custom_categories: next }).catch(e =>
        console.error('[useTaskBoard] Failed to save custom_categories:', e)
      )
      return next
    })
  }

  function removeCustomCategory(name: string) {
    // Remove from UI immediately
    setTasks(prev => prev.filter(t => t.category !== name))
    if (cat === name) setCat('Task')

    setCustomCats(prev => {
      const next = prev.filter(c => c !== name)
      // Persist category list update
      updateEvent(eventId, { custom_categories: next }).catch(e =>
        console.error('[useTaskBoard] Failed to save custom_categories:', e)
      )
      // Delete all tasks with this category from Supabase
      supabase.from('tasks').delete().eq('event_id', eventId).eq('category', name)
        .then(({ error }) => {
          if (error) { console.error('[useTaskBoard] Failed to delete tasks for category:', error); toast.error("Couldn't delete category", error.message) }
        })
      return next
    })
    toast.success(`"${name}" category deleted`)
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
      toast.success('Task created')
      void logInteraction('task.created', 'task', realId, eventId, `created task "${optimistic.title}"`)
    } catch (e) {
      console.error(e); setTasks(p => p.filter(t => t.id !== tempId))
      toast.error("Couldn't create task", errorMessage(e, 'Please try again.'))
    }
  }

  async function editTask(id: string, title: string, cat: string, notes: string, subtitles: string[]) {
    const newSubs = subtitles.map((t, i) => ({ id: `st_${i}`, title: t }))
    setTasks(p => p.map(t => t.id !== id ? t : { ...t, title, category: cat, notes, subtasks: newSubs }))
    try {
      await updateTask(id, title, cat, notes, subtitles)
      toast.success('Task updated')
      void logInteraction('task.updated', 'task', id, eventId, `updated task "${title}"`)
    } catch (e) { console.error(e); toast.error("Couldn't update task", errorMessage(e, 'Please try again.')) }
  }

  async function removeTask(id: string) {
    const removedTitle = tasks.find(t => t.id === id)?.title ?? 'a task'
    setTasks(p => p.filter(t => t.id !== id))
    try {
      await deleteTask(id)
      toast.success('Task deleted')
      void logInteraction('task.deleted', 'task', id, eventId, `deleted task "${removedTitle}"`)
    } catch (e) { console.error(e); toast.error("Couldn't delete task", errorMessage(e, 'Please try again.')) }
  }

  async function removeAssigned(taskId: string, mId: string) {
    const task = tasks.find(t => t.id === taskId)
    const memberName = task?.assigned.find(a => a.id === mId)?.name ?? 'a member'
    setTasks(p => p.map(t => t.id === taskId ? { ...t, assigned: t.assigned.filter(a => a.id !== mId) } : t))
    try {
      await unassignMember(taskId, mId)
      toast.info('Member unassigned')
      void logInteraction('task.member_unassigned', 'task', taskId, eventId, `removed ${memberName} from "${task?.title ?? 'a task'}"`)
    } catch (e) { console.error(e); toast.error("Couldn't unassign member", errorMessage(e, 'Please try again.')) }
  }

  return { members, tasks, loading, title, setTitle, cat, setCat, subtasks, setSubtasks, preAssigned, setPreAssigned, notes, setNotes, allCategories, selectedMemberId, selectMember, addCustomCategory, removeCustomCategory, addTask, editTask, removeTask, removeAssigned, ...drag }
}
