import { useState, useRef, useEffect } from 'react'
import type { Member } from '@/members/types/Member'
import type { Task } from '@/tasks/types/Task'
import { assignMember } from '@/tasks/services/assignMember'
import { logInteraction } from '@/interactions/services/logInteraction'

function findDropTarget(x: number, y: number) {
  const el = document.elementFromPoint(x, y)
  if (!el) return null
  const taskEl = el.closest('[data-task-id]') as HTMLElement | null
  if (taskEl?.dataset.taskId) return { type: 'task' as const, id: taskEl.dataset.taskId }
  if (el.closest('[data-drop-form]')) return { type: 'form' as const }
  return null
}

export interface DragAssignState {
  draggingMemberId: string | null
  overTask:  string | null
  overForm:  boolean
  setOverForm: (v: boolean) => void
  beginMemberDrag:    (memberId: string) => void
  moveMemberDrag:     (clientX: number, clientY: number) => void
  endMemberDrag:      (clientX: number, clientY: number) => void
  assignMemberToTask: (taskId: string, memberId: string) => void
}

/** Manages pointer-based drag-and-drop assignment of members to tasks. */
export function useDragAssign(
  members: Member[], tasks: Task[],
  setTasks: (fn: (prev: Task[]) => Task[]) => void,
  preAssigned: Member[], setPreAssigned: (fn: (prev: Member[]) => Member[]) => void,
  eventId: string,
): DragAssignState {
  const [draggingMemberId, setDraggingMemberId] = useState<string | null>(null)
  const [overTask, setOverTask] = useState<string | null>(null)
  const [overForm, setOverForm] = useState(false)
  const draggingRef = useRef<string | null>(null)

  useEffect(() => {
    if (!draggingMemberId) return
    document.body.style.cursor = 'grabbing'
    return () => { document.body.style.cursor = '' }
  }, [draggingMemberId])

  const beginMemberDrag = (memberId: string) => { draggingRef.current = memberId; setDraggingMemberId(memberId) }

  const moveMemberDrag = (clientX: number, clientY: number) => {
    const target = findDropTarget(clientX, clientY)
    if (target?.type === 'task')       { setOverTask(target.id); setOverForm(false) }
    else if (target?.type === 'form')  { setOverTask(null);      setOverForm(true)  }
    else                               { setOverTask(null);      setOverForm(false) }
  }

  const endMemberDrag = async (clientX: number, clientY: number) => {
    const memberId = draggingRef.current
    if (!memberId) return
    const m      = members.find(mem => mem.id === memberId)
    const target = findDropTarget(clientX, clientY)
    if (m && target?.type === 'task') {
      const taskId = target.id
      const task = tasks.find(t => t.id === taskId)
      if (!task?.assigned.some(a => a.id === m.id)) {
        setTasks(p => p.map(t => t.id !== taskId ? t : { ...t, assigned: [...t.assigned, m] }))
        try {
          await assignMember(taskId, m.id)
          void logInteraction('task.member_assigned', 'task', taskId, eventId, `assigned ${m.name} to "${task?.title ?? 'a task'}"`)
        } catch (err) { console.error(err) }
      }
    } else if (m && target?.type === 'form') {
      if (!preAssigned.some(a => a.id === m.id)) setPreAssigned(p => [...p, m])
    }
    draggingRef.current = null; setDraggingMemberId(null); setOverTask(null); setOverForm(false)
  }

  const assignMemberToTask = async (taskId: string, memberId: string) => {
    const m = members.find(mem => mem.id === memberId)
    const task = tasks.find(t => t.id === taskId)
    if (!m || task?.assigned.some(a => a.id === m.id)) return
    setTasks(p => p.map(t => t.id !== taskId ? t : { ...t, assigned: [...t.assigned, m] }))
    try {
      await assignMember(taskId, m.id)
      void logInteraction('task.member_assigned', 'task', taskId, eventId, `assigned ${m.name} to "${task?.title ?? 'a task'}"`)
    } catch (err) { console.error(err) }
  }

  return { draggingMemberId, overTask, overForm, setOverForm, beginMemberDrag, moveMemberDrag, endMemberDrag, assignMemberToTask }
}
