import type { DragEvent } from 'react'
import type { Task } from '../data/types'
import { CAT_CFG, ALL_CATS } from '../data/config'
import { AssignedChip } from './AssignedChip'

interface Props {
  dark: boolean
  tasks: Task[]
  loading: boolean
  overTask: string | null
  onToggleDark: () => void
  onDragOver:      (e: DragEvent<HTMLDivElement>, taskId: string) => void
  onDragLeave:     (e: DragEvent<HTMLDivElement>) => void
  onDrop:          (e: DragEvent<HTMLDivElement>, taskId: string) => void
  onRemoveTask:    (id: string) => void
  onRemoveAssigned:(taskId: string, memberId: string) => void
}

export function MiddlePanel({ dark, tasks, loading, overTask, onToggleDark, onDragOver, onDragLeave, onDrop, onRemoveTask, onRemoveAssigned }: Props) {
  return (
    <main className="flex-1 flex flex-col overflow-hidden min-w-0">
      <header className="h-14 px-7 bg-white dark:bg-[#0A1209] border-b border-gray-200 dark:border-[#00FF66]/[.10] flex items-center gap-3.5 shrink-0">
        <div className="w-1 h-6 bg-paksoc-bright rounded-sm dark:shadow-[0_0_8px_#00FF66]" />
        <h1 className="m-0 text-[17px] font-extrabold text-paksoc-deep dark:text-[#D4FAE3]">Manage Tasks</h1>
        <span className="bg-gray-100 dark:bg-[#00FF66]/[.08] text-paksoc-mid dark:text-[#00FF66] rounded-full px-3 py-0.5 text-xs font-semibold">
          {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
        </span>
        <div className="ml-auto">
          <button onClick={onToggleDark} className="flex items-center gap-2 bg-gray-100 dark:bg-[#00FF66]/[.07] border border-gray-200 dark:border-[#00FF66]/[.20] rounded-full px-3 py-1.5 cursor-pointer transition-all">
            <div className="w-8 h-[18px] rounded-full relative transition-colors" style={{ background: dark ? '#001A0A' : '#D1D5DB' }}>
              <div className="absolute top-[2px] w-[14px] h-[14px] rounded-full shadow transition-all" style={{ left: dark ? '18px' : '2px', background: dark ? '#00FF66' : 'white', boxShadow: dark ? '0 0 8px #00FF66' : 'none' }} />
            </div>
            <span className="text-xs font-semibold text-paksoc-mid dark:text-[#00FF66] select-none">{dark ? '⚡ Paki' : '☀️ Classic'}</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3">
        {loading && (
          <div className="flex flex-col gap-3 pt-2">
            {[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-white dark:bg-[#111B13] animate-pulse border border-gray-100 dark:border-[#00FF66]/[.06]" />)}
          </div>
        )}

        {!loading && tasks.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center pt-20 select-none">
            <div className="text-5xl mb-4 opacity-50">📋</div>
            <div className="text-base font-bold text-gray-400 dark:text-[#2B5C3C] mb-1.5">No tasks yet</div>
            <div className="text-sm text-gray-300 dark:text-[#1E4029]">Use the form on the right →</div>
          </div>
        )}

        {!loading && ALL_CATS.map(category => {
          const catTasks = tasks.filter(t => t.category === category)
          if (!catTasks.length) return null
          const cfg = CAT_CFG[category]
          return (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${cfg.headerCls}`}>{cfg.icon} {category}</span>
                <span className="text-xs text-gray-400 dark:text-[#2B5C3C]">{catTasks.length} {catTasks.length === 1 ? 'item' : 'items'}</span>
                <div className="flex-1 h-px bg-gray-100 dark:bg-[#00FF66]/[.06]" />
              </div>
              <div className="flex flex-col gap-2.5 mb-5">
                {catTasks.map(task => {
                  const isOver = overTask === task.id
                  return (
                    <div key={task.id} onDragOver={e => onDragOver(e, task.id)} onDragLeave={onDragLeave} onDrop={e => onDrop(e, task.id)}
                      className={`relative bg-white dark:bg-[#111B13] rounded-xl p-4 transition-all ${isOver ? 'border-2 border-dashed border-paksoc-bright dark:shadow-[0_0_20px_rgba(0,255,102,0.15)]' : 'border border-gray-100 dark:border-[#00FF66]/[.08] shadow-sm'}`}>
                      <button onClick={() => onRemoveTask(task.id)} className="absolute top-3 right-3 text-gray-300 dark:text-[#2B5C3C] hover:text-red-400 bg-transparent border-none cursor-pointer text-base leading-none transition-colors">×</button>
                      <div className="text-sm font-bold text-paksoc-deep dark:text-[#D4FAE3] pr-5 mb-2">{task.title}</div>
                      {task.subtasks.length > 0 && (
                        <ul className="list-none m-0 p-0 flex flex-col gap-1 mb-3">
                          {task.subtasks.map(st => (
                            <li key={st.id} className="flex items-center gap-2 text-xs text-paksoc-mid dark:text-[#5DE68A]">
                              <span className="w-1.5 h-1.5 rounded-full bg-paksoc-bright shrink-0 dark:shadow-[0_0_4px_#00FF66]" />{st.title}
                            </li>
                          ))}
                        </ul>
                      )}
                      {task.assigned.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {task.assigned.map(m => <AssignedChip key={m.id} member={m} onRemove={() => onRemoveAssigned(task.id, m.id)} />)}
                        </div>
                      )}
                      {task.notes && <div className="mt-2 px-3 py-2 bg-gray-50 dark:bg-[#0A1209] rounded-lg text-xs text-paksoc-mid dark:text-[#5DE68A] border-l-2 border-gray-200 dark:border-[#00FF66]/[.25] leading-relaxed">{task.notes}</div>}
                      <div className={`text-[11px] mt-1.5 transition-colors ${isOver ? 'text-paksoc-bright dark:drop-shadow-[0_0_4px_#00FF66]' : 'text-gray-300 dark:text-[#1E4029]'}`}>
                        {isOver ? '⬇ Release to assign' : '↙ Drag a member here to assign'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}
