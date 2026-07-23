import { useState } from 'react'
import type { Task } from '@/tasks/types/Task'
import type { Member } from '@/members/types/Member'
import { getCatCfg } from '@/config/categoryConfig'
import { AssignedChip }  from '@/tasks/components/assignment/AssignedChip'
import { EditTaskModal } from '@/tasks/components/forms/EditTaskModal'
import { ConfirmModal }  from '@/shared/components/ConfirmModal'
import { HistoryButton } from '@/interactions/components/HistoryButton'
import { HistoryPanel }  from '@/interactions/components/HistoryPanel'
import { TaskFilterMenu } from '@/tasks/components/panels/TaskFilterMenu'
import { fetchEventTaskInteractions } from '@/interactions/services/fetchEventTaskInteractions'

interface Props {
  tasks:             Task[];  loading:          boolean; overTask:      string | null
  members:           Member[]
  allCategories:     string[]; eventId:         string
  mobile?:           boolean; currentUserAuthId?: string; selectedMemberId?: string | null
  myTasksOnly?:      boolean; onMyTasksChange?: (v: boolean) => void
  onRemoveTask:      (id: string) => void
  onRemoveAssigned:  (taskId: string, memberId: string) => void
  onApplyAssignees:  (taskId: string, memberIds: string[]) => void
  onEditTask:        (id: string, title: string, cat: string, notes: string, subs: string[]) => void
  onToggleSubtask:   (taskId: string, subtaskId: string, done: boolean) => void
  onTaskClick?:      (taskId: string) => void
}

export function TaskListPanel({ tasks, loading, overTask, members, allCategories, eventId, mobile, currentUserAuthId, selectedMemberId, myTasksOnly = false, onMyTasksChange, onRemoveTask, onRemoveAssigned, onApplyAssignees, onEditTask, onToggleSubtask, onTaskClick }: Props) {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null)
  const [unassigning,   setUnassigning]   = useState<{ taskId: string; memberId: string; name: string } | null>(null)
  const [showHistory,   setShowHistory]   = useState(false)

  // Derive from the live tasks list so the edit modal's assignee list stays current
  const editingTask = editingTaskId ? tasks.find(t => t.id === editingTaskId) ?? null : null

  const visibleTasks = myTasksOnly && currentUserAuthId
    ? tasks.filter(t => t.assigned.some(m => m.user_id === currentUserAuthId))
    : tasks

  const hasSelected = !!selectedMemberId

  return (
    <main className={`flex flex-col overflow-hidden min-w-0 bg-transparent ${mobile ? 'flex-1 min-h-0 w-full' : 'hidden lg:flex flex-1'}`}>
      {!mobile && (
        <header className="h-14 px-7 bg-[#0B0E15] border-b border-[#1D2129] flex items-center gap-3 shrink-0">
          <div className="w-1 h-5 bg-[#22C55E] rounded-sm" />
          <h1 className="m-0 text-[17px] font-extrabold text-[#F8FAFC]">Manage Tasks</h1>
          <span className="bg-white/[0.06] text-[#94A3B8] rounded-full px-3 py-0.5 text-xs font-semibold">{visibleTasks.length} {visibleTasks.length === 1 ? 'task' : 'tasks'}</span>
          {hasSelected && (
            <span className="ml-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 border border-blue-400/40 text-blue-300">
              Member selected — click a task to assign
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            <TaskFilterMenu myTasksOnly={myTasksOnly} onChange={v => onMyTasksChange?.(v)} showMine={!!currentUserAuthId} />
            <HistoryButton onClick={() => setShowHistory(true)} label="View task history for this event" />
          </div>
        </header>
      )}
      <div className={`flex-1 overflow-y-auto no-scrollbar flex flex-col gap-3 ${mobile ? 'p-4' : 'p-6'}`}>
        {loading && <div className="flex flex-col gap-3 pt-2">{[1,2,3].map(i => <div key={i} className="motion-skeleton h-24 rounded-xl border border-[#1D2129]" />)}</div>}
        {!loading && visibleTasks.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center pt-12 px-4">
            <div className="text-base font-bold text-[#94A3B8] mb-1.5">{myTasksOnly ? 'No tasks assigned to you' : 'No tasks yet'}</div>
            <div className="text-sm text-[#64748B]">{myTasksOnly ? 'Ask an exec to assign you a task' : mobile ? 'Tap + to create a task' : 'Use the form on the right →'}</div>
          </div>
        )}
        {!loading && allCategories.map(category => {
          const catTasks = visibleTasks.filter(t => t.category === category)
          if (!catTasks.length) return null
          const cfg = getCatCfg(category)
          return (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${cfg.headerCls}`}>{category}</span>
                <span className="text-xs text-[#64748B]">{catTasks.length} {catTasks.length === 1 ? 'item' : 'items'}</span>
                <div className="flex-1 h-px bg-[#1D2129]" />
              </div>
              <div className="flex flex-col gap-2.5 mb-5">
                {catTasks.map(task => {
                  const isOver = overTask === task.id
                  const doneHint = mobile ? '' : isOver ? 'Release to assign' : hasSelected ? '' : 'Drag or click a member, then click a card'
                  return (
                    <div key={task.id} data-task-id={task.id}
                      onClick={() => !mobile && onTaskClick?.(task.id)}
                      className={`task-card group relative bg-[#0B0E15] rounded-xl p-4 select-none ${hasSelected && !mobile ? 'cursor-pointer hover:border-[#22C55E] hover:bg-[#0D1119]' : ''} ${isOver ? 'border-2 border-dashed border-[#22C55E] bg-[#22C55E]/[0.04]' : 'border border-[#1D2129] hover:border-[#2E333D]'}`}>
                      <div className="absolute top-3 right-3 flex items-center gap-1">
                        <button onClick={e => { e.stopPropagation(); setEditingTaskId(task.id) }} aria-label="Edit task" className="h-6 px-1.5 inline-flex items-center justify-center text-[#94A3B8] hover:text-[#F8FAFC] bg-transparent border-none cursor-pointer text-[11px] font-semibold leading-none transition-colors">Edit</button>
                        <button onClick={e => { e.stopPropagation(); setDeletingTaskId(task.id) }} aria-label="Delete task" className="h-6 w-6 inline-flex items-center justify-center text-lg text-[#64748B] hover:text-red-400 bg-transparent border-none cursor-pointer leading-none transition-colors">{'×'}</button>
                      </div>
                      <div className="flex items-center gap-2 pr-14 mb-2.5">
                        <span className="text-sm font-bold text-[#F8FAFC] min-w-0 break-words">{task.title}</span>
                        {task.subtasks.length > 0 && (
                          <span className="shrink-0 text-[10px] font-bold text-[#64748B] bg-white/[0.05] rounded px-1.5 py-0.5">{task.subtasks.length} {task.subtasks.length === 1 ? 'step' : 'steps'}</span>
                        )}
                      </div>
                      {task.subtasks.length > 0 && (
                        <div className="mb-3 rounded-lg border border-[#171C18] bg-white/[0.02] overflow-hidden">
                          {task.subtasks.map(st => (
                            <div key={st.id} className="border-b border-[#141814] last:border-b-0">
                              <button type="button" aria-pressed={st.done}
                                onClick={e => { e.stopPropagation(); onToggleSubtask(task.id, st.id, !st.done) }}
                                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-left bg-transparent border-0 cursor-pointer hover:bg-white/[0.03] transition-colors">
                                <span className={`w-3.5 h-3.5 rounded-[4px] border-[1.5px] shrink-0 inline-flex items-center justify-center transition-colors ${st.done ? 'bg-[#22C55E] border-[#22C55E] text-[#0B0E15]' : 'border-[#2E333D]'}`}>
                                  {st.done && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5" aria-hidden><path d="M20 6 9 17l-5-5" /></svg>}
                                </span>
                                <span className={`min-w-0 break-words transition-colors ${st.done ? 'line-through text-[#64748B]' : 'text-[#94A3B8]'}`}>{st.title}</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {task.assigned.length > 0 && (
                        <div className="flex items-center gap-1.5 mb-2" onClick={e => e.stopPropagation()}>
                          <div className={`flex gap-1.5 min-w-0 ${mobile ? 'flex-1 overflow-x-auto no-scrollbar' : 'flex-wrap'}`}>
                            {task.assigned.map(m => <AssignedChip key={m.id} member={m} onRemove={() => setUnassigning({ taskId: task.id, memberId: m.id, name: m.name })} />)}
                          </div>
                        </div>
                      )}
                      {task.notes && <div className="mt-2 px-3 py-2 bg-white/[0.04] rounded-lg text-xs text-[#94A3B8] border-l-2 border-[#2E333D] leading-relaxed whitespace-pre-wrap break-words">{task.notes}</div>}
                      {!mobile && <div className={`text-[11px] mt-1.5 transition-opacity ${isOver ? 'text-[#4ADE80] opacity-100' : 'text-[#64748B] opacity-0 group-hover:opacity-100'}`}>{doneHint || ' '}</div>}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      {editingTask && (
        <EditTaskModal task={editingTask} members={members} allCategories={allCategories} mobile={mobile}
          onClose={() => setEditingTaskId(null)}
          onSave={(id, title, cat, notes, subs) => { onEditTask(id, title, cat, notes, subs); setEditingTaskId(null) }}
          onUnassignMember={onRemoveAssigned} onApplyAssignees={onApplyAssignees} />
      )}
      {deletingTaskId && (
        <ConfirmModal
          title="Delete task?"
          message="This will permanently remove the task and all its assignments. This cannot be undone."
          confirmLabel="Delete"
          danger
          onConfirm={() => { onRemoveTask(deletingTaskId); setDeletingTaskId(null) }}
          onCancel={() => setDeletingTaskId(null)} />
      )}
      {unassigning && (
        <ConfirmModal
          title="Unassign member?"
          message={`Remove ${unassigning.name} from this task? They'll no longer see it under their assignments.`}
          confirmLabel="Unassign"
          danger
          onConfirm={() => { onRemoveAssigned(unassigning.taskId, unassigning.memberId); setUnassigning(null) }}
          onCancel={() => setUnassigning(null)} />
      )}
      {showHistory && (
        <HistoryPanel title="Task History" onClose={() => setShowHistory(false)}
          fetcher={() => fetchEventTaskInteractions(eventId)} emptyMessage="No task activity for this event yet." />
      )}
    </main>
  )
}
