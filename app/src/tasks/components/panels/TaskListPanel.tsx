import { useState } from 'react'
import type { Task } from '@/tasks/types/Task'
import { getCatCfg } from '@/config/categoryConfig'
import { AssignedChip }  from '@/tasks/components/assignment/AssignedChip'
import { EditTaskModal } from '@/tasks/components/forms/EditTaskModal'
import { ConfirmModal }  from '@/shared/components/ConfirmModal'

interface Props {
  tasks:             Task[];  loading:          boolean; overTask:      string | null
  allCategories:     string[]
  mobile?:           boolean; currentUserAuthId?: string; selectedMemberId?: string | null
  onRemoveTask:      (id: string) => void
  onRemoveAssigned:  (taskId: string, memberId: string) => void
  onEditTask:        (id: string, title: string, cat: string, notes: string, subs: string[]) => void
  onAssignClick?:    (taskId: string) => void
  onTaskClick?:      (taskId: string) => void
}

export function TaskListPanel({ tasks, loading, overTask, allCategories, mobile, currentUserAuthId, selectedMemberId, onRemoveTask, onRemoveAssigned, onEditTask, onAssignClick, onTaskClick }: Props) {
  const [editingTask,   setEditingTask]   = useState<Task | null>(null)
  const [myTasksOnly,   setMyTasksOnly]   = useState(false)
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null)

  const visibleTasks = myTasksOnly && currentUserAuthId
    ? tasks.filter(t => t.assigned.some(m => m.user_id === currentUserAuthId))
    : tasks

  const hasSelected = !!selectedMemberId

  return (
    <main className={`flex flex-col overflow-hidden min-w-0 ${mobile ? 'flex-1 min-h-0 w-full' : 'hidden lg:flex flex-1'}`}>
      {!mobile && (
        <header className="h-14 px-7 bg-[#0B0E0C] border-b border-[#1D231F] flex items-center gap-3 shrink-0">
          <div className="w-1 h-5 bg-[#22C55E] rounded-sm" />
          <h1 className="m-0 text-[17px] font-extrabold text-[#F8FAFC]">Manage Tasks</h1>
          <span className="bg-white/[0.06] text-[#94A3B8] rounded-full px-3 py-0.5 text-xs font-semibold">{visibleTasks.length} {visibleTasks.length === 1 ? 'task' : 'tasks'}</span>
          {currentUserAuthId && (
            <button onClick={() => setMyTasksOnly(v => !v)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold border-2 cursor-pointer transition-all ${myTasksOnly ? 'bg-[#22C55E] text-white border-[#22C55E]' : 'bg-transparent border-[#2E3630] text-[#94A3B8] hover:border-[#22C55E] hover:text-[#4ADE80]'}`}>
              My Tasks
            </button>
          )}
          {hasSelected && (
            <span className="ml-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 border border-blue-400/40 text-blue-300">
              Member selected — click a task to assign
            </span>
          )}
        </header>
      )}
      {mobile && currentUserAuthId && (
        <div className="px-4 py-2 border-b border-[#1D231F] shrink-0 bg-[#0B0E0C]">
          <button onClick={() => setMyTasksOnly(v => !v)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold border-2 cursor-pointer transition-all ${myTasksOnly ? 'bg-[#22C55E] text-white border-[#22C55E]' : 'bg-transparent border-[#2E3630] text-[#94A3B8] hover:border-[#22C55E]'}`}>
            My Tasks
          </button>
        </div>
      )}

      <div className={`flex-1 overflow-y-auto flex flex-col gap-3 ${mobile ? 'p-4' : 'p-6'}`}>
        {loading && <div className="flex flex-col gap-3 pt-2">{[1,2,3].map(i => <div key={i} className="motion-skeleton h-24 rounded-xl border border-[#1D231F]" />)}</div>}
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
                <div className="flex-1 h-px bg-[#1D231F]" />
              </div>
              <div className="flex flex-col gap-2.5 mb-5">
                {catTasks.map(task => {
                  const isOver = overTask === task.id
                  return (
                    <div key={task.id} data-task-id={task.id}
                      onClick={() => !mobile && onTaskClick?.(task.id)}
                      className={`motion-card relative bg-[#0B0E0C] rounded-xl p-4 transition-all select-none ${hasSelected && !mobile ? 'cursor-pointer hover:border-[#22C55E]' : ''} ${isOver ? 'border-2 border-dashed border-[#22C55E]' : 'border border-[#1D231F]'}`}>
                      <div className="absolute top-3 right-3 flex items-center gap-1">
                        <button onClick={e => { e.stopPropagation(); setEditingTask(task) }} className="text-[#94A3B8] hover:text-[#F8FAFC] bg-transparent border-none cursor-pointer text-[11px] font-semibold leading-none transition-colors px-1.5 py-1">Edit</button>
                        <button onClick={e => { e.stopPropagation(); setDeletingTaskId(task.id) }} className="text-[#64748B] hover:text-red-400 bg-transparent border-none cursor-pointer text-base leading-none transition-colors p-1">×</button>
                      </div>
                      <div className="text-sm font-bold text-[#F8FAFC] pr-14 mb-2">{task.title}</div>
                      {task.subtasks.length > 0 && (
                        <ul className="list-none m-0 p-0 flex flex-col gap-1 mb-3">
                          {task.subtasks.map(st => (
                            <li key={st.id} className="flex items-center gap-2 text-xs text-[#94A3B8]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] shrink-0" />{st.title}
                            </li>
                          ))}
                        </ul>
                      )}
                      {task.assigned.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2" onClick={e => e.stopPropagation()}>
                          {task.assigned.map(m => <AssignedChip key={m.id} member={m} onRemove={() => onRemoveAssigned(task.id, m.id)} />)}
                        </div>
                      )}
                      {task.notes && <div className="mt-2 px-3 py-2 bg-white/[0.04] rounded-lg text-xs text-[#94A3B8] border-l-2 border-[#2E3630] leading-relaxed">{task.notes}</div>}
                      {mobile
                        ? <button type="button" onClick={() => onAssignClick?.(task.id)} className="mt-3 w-full py-2 rounded-lg text-xs font-bold border border-[#22C55E]/40 bg-green-500/10 text-[#4ADE80] cursor-pointer active:scale-[0.98] transition-transform">+ Assign</button>
                        : <div className={`text-[11px] mt-1.5 transition-colors ${isOver ? 'text-[#4ADE80]' : 'text-[#64748B]'}`}>{isOver ? 'Release to assign' : hasSelected ? '' : 'Drag or click a member then click here'}</div>
                      }
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      {editingTask && (
        <EditTaskModal task={editingTask} allCategories={allCategories} onClose={() => setEditingTask(null)}
          onSave={(id, title, cat, notes, subs) => { onEditTask(id, title, cat, notes, subs); setEditingTask(null) }} />
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
    </main>
  )
}
