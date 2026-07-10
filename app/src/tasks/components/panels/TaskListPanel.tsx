import { useState } from 'react'
import type { Task, TaskCategory } from '@/tasks/types/Task'
import { CAT_CFG, ALL_CATS } from '@/config/categoryConfig'
import { AssignedChip }  from '@/tasks/components/assignment/AssignedChip'
import { EditTaskModal } from '@/tasks/components/forms/EditTaskModal'

interface Props {
  dark: boolean; tasks: Task[]; loading: boolean; overTask: string | null
  mobile?: boolean; currentUserAuthId?: string
  onToggleDark:    () => void
  onRemoveTask:    (id: string) => void
  onRemoveAssigned:(taskId: string, memberId: string) => void
  onEditTask:      (id: string, title: string, cat: TaskCategory, notes: string, subs: string[]) => void
  onAssignClick?:  (taskId: string) => void
}

/** Centre panel showing task cards grouped by category. */
export function TaskListPanel({ dark, tasks, loading, overTask, mobile, currentUserAuthId, onToggleDark, onRemoveTask, onRemoveAssigned, onEditTask, onAssignClick }: Props) {
  const [editingTask, setEditingTask]   = useState<Task | null>(null)
  const [myTasksOnly, setMyTasksOnly]   = useState(false)
  const visibleTasks = myTasksOnly && currentUserAuthId ? tasks.filter(t => t.assigned.some(m => m.user_id === currentUserAuthId)) : tasks

  return (
    <main className={`flex flex-col overflow-hidden min-w-0 ${mobile ? 'flex-1 min-h-0 w-full' : 'hidden lg:flex flex-1'}`}>
      {!mobile && (
        <header className="h-14 px-7 bg-white dark:bg-[#0A1209] border-b border-gray-200 dark:border-[#AAFF00]/[.10] flex items-center gap-3.5 shrink-0">
          <div className="w-1 h-6 bg-paksoc-bright rounded-sm dark:shadow-[0_0_8px_#AAFF00]" />
          <h1 className="m-0 text-[17px] font-extrabold text-paksoc-deep dark:text-[#D4FAE3]">Manage Tasks</h1>
          <span className="bg-gray-100 dark:bg-[#AAFF00]/[.08] text-paksoc-mid dark:text-[#AAFF00] rounded-full px-3 py-0.5 text-xs font-semibold">{visibleTasks.length} {visibleTasks.length === 1 ? 'task' : 'tasks'}</span>
          {currentUserAuthId && <button onClick={() => setMyTasksOnly(v => !v)} className={`rounded-full px-3 py-1 text-xs font-semibold border cursor-pointer transition-all ${myTasksOnly ? 'bg-paksoc-bright text-paksoc-deep border-paksoc-bright' : 'bg-transparent border-gray-200 dark:border-[#AAFF00]/20 text-gray-400 dark:text-[#5DE68A] hover:border-paksoc-bright'}`}>My Tasks</button>}
          <div className="ml-auto"><button onClick={onToggleDark} className="flex items-center gap-2 bg-gray-100 dark:bg-[#AAFF00]/[.07] border border-gray-200 dark:border-[#AAFF00]/[.20] rounded-full px-3 py-1.5 cursor-pointer transition-all">
            <div className="w-8 h-[18px] rounded-full relative transition-colors" style={{ background: dark ? '#001A0A' : '#D1D5DB' }}>
              <div className="absolute top-[2px] w-[14px] h-[14px] rounded-full shadow transition-all" style={{ left: dark ? '18px' : '2px', background: dark ? '#AAFF00' : 'white', boxShadow: dark ? '0 0 8px #AAFF00' : 'none' }} />
            </div>
            <span className="text-xs font-semibold text-paksoc-mid dark:text-[#AAFF00] select-none">{dark ? 'Paki' : 'Classic'}</span>
          </button></div>
        </header>
      )}
      {mobile && currentUserAuthId && <div className="px-4 py-2 border-b border-gray-200 dark:border-[#AAFF00]/[.10] shrink-0 bg-white dark:bg-[#0A1209]"><button onClick={() => setMyTasksOnly(v => !v)} className={`rounded-full px-3 py-1 text-xs font-semibold border cursor-pointer ${myTasksOnly ? 'bg-paksoc-bright text-paksoc-deep border-paksoc-bright' : 'bg-transparent border-gray-200 dark:border-[#AAFF00]/20 text-gray-400 dark:text-[#5DE68A]'}`}>My Tasks</button></div>}
      <div className={`flex-1 overflow-y-auto flex flex-col gap-3 ${mobile ? 'p-4' : 'p-6'}`}>
        {loading && <div className="flex flex-col gap-3 pt-2">{[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-white dark:bg-[#111B13] animate-pulse border border-gray-100 dark:border-[#AAFF00]/[.06]" />)}</div>}
        {!loading && visibleTasks.length === 0 && <div className="flex-1 flex flex-col items-center justify-center text-center pt-12 select-none px-4"><div className="text-base font-bold text-gray-400 dark:text-[#2B5C3C] mb-1.5">{myTasksOnly ? 'No tasks assigned to you' : 'No tasks yet'}</div><div className="text-sm text-gray-300 dark:text-[#1E4029]">{myTasksOnly ? 'Ask an exec to assign you a task' : mobile ? 'Tap + to create a task' : 'Use the form on the right →'}</div></div>}
        {!loading && ALL_CATS.map(category => {
          const catTasks = visibleTasks.filter(t => t.category === category)
          if (!catTasks.length) return null
          const cfg = CAT_CFG[category]
          return (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3"><span className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${cfg.headerCls}`}>{category}</span><span className="text-xs text-gray-400 dark:text-[#2B5C3C]">{catTasks.length} {catTasks.length === 1 ? 'item' : 'items'}</span><div className="flex-1 h-px bg-gray-100 dark:bg-[#AAFF00]/[.06]" /></div>
              <div className="flex flex-col gap-2.5 mb-5">
                {catTasks.map(task => {
                  const isOver = overTask === task.id
                  return (
                    <div key={task.id} data-task-id={task.id} className={`relative bg-white dark:bg-[#111B13] rounded-xl p-4 transition-all ${isOver ? 'border-2 border-dashed border-paksoc-bright dark:shadow-[0_0_20px_rgba(0,255,102,0.15)]' : 'border border-gray-100 dark:border-[#AAFF00]/[.08] shadow-sm'}`}>
                      <div className="absolute top-3 right-3 flex items-center gap-1">
                        <button onClick={e => { e.stopPropagation(); setEditingTask(task) }} className="text-gray-400 dark:text-[#1E4029] hover:text-paksoc-mid dark:hover:text-[#AAFF00] bg-transparent border-none cursor-pointer text-[11px] font-semibold leading-none transition-colors px-1.5 py-1">Edit</button>
                        <button onClick={e => { e.stopPropagation(); onRemoveTask(task.id) }} className="text-gray-300 dark:text-[#2B5C3C] hover:text-red-400 bg-transparent border-none cursor-pointer text-base leading-none transition-colors p-1">×</button>
                      </div>
                      <div className="text-sm font-bold text-paksoc-deep dark:text-[#D4FAE3] pr-14 mb-2">{task.title}</div>
                      {task.subtasks.length > 0 && <ul className="list-none m-0 p-0 flex flex-col gap-1 mb-3">{task.subtasks.map(st => <li key={st.id} className="flex items-center gap-2 text-xs text-paksoc-mid dark:text-[#5DE68A]"><span className="w-1.5 h-1.5 rounded-full bg-paksoc-bright shrink-0 dark:shadow-[0_0_4px_#AAFF00]" />{st.title}</li>)}</ul>}
                      {task.assigned.length > 0 && <div className="flex flex-wrap gap-1.5 mb-2" onClick={e => e.stopPropagation()}>{task.assigned.map(m => <AssignedChip key={m.id} member={m} onRemove={() => onRemoveAssigned(task.id, m.id)} />)}</div>}
                      {task.notes && <div className="mt-2 px-3 py-2 bg-gray-50 dark:bg-[#0A1209] rounded-lg text-xs text-paksoc-mid dark:text-[#5DE68A] border-l-2 border-gray-200 dark:border-[#AAFF00]/[.25] leading-relaxed">{task.notes}</div>}
                      {mobile ? <button type="button" onClick={() => onAssignClick?.(task.id)} className="mt-3 w-full py-2 rounded-lg text-xs font-bold border border-paksoc-bright/40 bg-paksoc-bright/10 text-paksoc-deep dark:text-[#AAFF00] cursor-pointer active:scale-[0.98] transition-transform">+ Assign</button>
                               : <div className={`text-[11px] mt-1.5 transition-colors ${isOver ? 'text-paksoc-bright dark:drop-shadow-[0_0_4px_#AAFF00]' : 'text-gray-300 dark:text-[#1E4029]'}`}>{isOver ? 'Release to assign' : 'Drag a member here to assign'}</div>}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      {editingTask && <EditTaskModal task={editingTask} dark={dark} onClose={() => setEditingTask(null)} onSave={(id, title, cat, notes, subs) => { onEditTask(id, title, cat, notes, subs); setEditingTask(null) }} />}
    </main>
  )
}
