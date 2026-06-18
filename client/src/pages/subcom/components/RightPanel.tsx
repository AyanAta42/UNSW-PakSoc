import type { DragEvent, Dispatch, SetStateAction } from 'react'
import type { TaskCategory, Member } from '../data/types'
import { CAT_CFG, ALL_CATS, inputCls, labelCls } from '../data/config'
import { AssignedChip } from './AssignedChip'

interface Props {
  title: string;       setTitle:        Dispatch<SetStateAction<string>>
  cat: TaskCategory;   setCat:          Dispatch<SetStateAction<TaskCategory>>
  subtasks: string[];  setSubtasks:     Dispatch<SetStateAction<string[]>>
  preAssigned: Member[];setPreAssigned: Dispatch<SetStateAction<Member[]>>
  notes: string;       setNotes:        Dispatch<SetStateAction<string>>
  overForm: boolean;   setOverForm:     Dispatch<SetStateAction<boolean>>
  onDropForm: (e: DragEvent<HTMLDivElement>) => void
  onAddTask:  () => void
}

export function RightPanel({ title, setTitle, cat, setCat, subtasks, setSubtasks, preAssigned, setPreAssigned, notes, setNotes, overForm, setOverForm, onDropForm, onAddTask }: Props) {
  return (
    <aside className="w-[310px] shrink-0 flex flex-col overflow-hidden bg-white dark:bg-[#0D1610] border-l border-gray-200 dark:border-[#00FF66]/[.10]">
      <div className="p-5 border-b border-gray-200 dark:border-[#00FF66]/[.10] shrink-0">
        <div className="text-[15px] font-extrabold text-paksoc-deep dark:text-[#D4FAE3]">+ New Task</div>
        <div className="text-xs text-gray-400 dark:text-[#2B5C3C] mt-1">Fill in details below</div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
        <div>
          <label className={labelCls}>Task Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && onAddTask()} placeholder="e.g. Buy equipment" className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Category</label>
          <div className="flex gap-2">
            {ALL_CATS.map(c => (
              <button key={c} onClick={() => setCat(c)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold border-[1.5px] cursor-pointer transition-all ${cat === c ? CAT_CFG[c].activeCls : 'bg-gray-50 dark:bg-[#00FF66]/[.04] border-gray-200 dark:border-[#00FF66]/[.12] text-gray-400 dark:text-[#2B5C3C]'}`}>
                {CAT_CFG[c].icon} {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelCls}>Subtasks</label>
          <div className="flex flex-col gap-2">
            {subtasks.map((st, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-paksoc-bright shrink-0 dark:shadow-[0_0_4px_#00FF66]" />
                <input value={st} onChange={e => setSubtasks(p => p.map((s, j) => j === i ? e.target.value : s))} placeholder={`Subtask ${i + 1}`} className={inputCls + ' text-xs'} />
                {subtasks.length > 1 && (
                  <button onClick={() => setSubtasks(p => p.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-400 bg-transparent border-none cursor-pointer text-base leading-none transition-colors shrink-0">×</button>
                )}
              </div>
            ))}
          </div>
          <button onClick={() => setSubtasks(p => [...p, ''])} className="mt-2 w-full py-1.5 bg-transparent border border-dashed border-gray-200 dark:border-[#00FF66]/[.20] rounded-lg text-xs font-semibold text-paksoc-mid dark:text-[#2B5C3C] cursor-pointer hover:border-paksoc-bright dark:hover:border-paksoc-bright dark:hover:text-[#00FF66] transition-colors">
            + Add subtask
          </button>
        </div>

        <div>
          <label className={labelCls}>Assignees</label>
          <div
            onDragOver={e => { e.preventDefault(); setOverForm(true) }}
            onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverForm(false) }}
            onDrop={onDropForm}
            className={`min-h-[60px] rounded-xl p-2.5 border-2 border-dashed flex flex-wrap gap-1.5 transition-all ${overForm ? 'border-paksoc-bright bg-paksoc-bright/[.05] dark:shadow-[0_0_20px_rgba(0,255,102,0.1)]' : 'border-gray-200 dark:border-[#00FF66]/[.12] bg-gray-50 dark:bg-[#070C09]'}`}
          >
            {preAssigned.length === 0
              ? <p className={`w-full text-center text-xs py-2 select-none ${overForm ? 'text-paksoc-bright' : 'text-gray-300 dark:text-[#1E4029]'}`}>{overForm ? '⬇ Release to add' : '↙ Drag team members here'}</p>
              : preAssigned.map(m => <AssignedChip key={m.id} member={m} onRemove={() => setPreAssigned(p => p.filter(a => a.id !== m.id))} />)
            }
          </div>
        </div>

        <div>
          <label className={labelCls}>Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional details..." rows={3} className={inputCls + ' resize-y leading-relaxed'} />
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-[#00FF66]/[.10] shrink-0">
        <button onClick={onAddTask} disabled={!title.trim()} className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer border-none ${title.trim() ? 'bg-paksoc-mid text-white hover:bg-paksoc-deep dark:bg-paksoc-bright dark:text-[#070C09] dark:hover:opacity-90 dark:shadow-[0_0_16px_rgba(0,255,102,0.4)]' : 'bg-gray-100 dark:bg-[#00FF66]/[.05] text-gray-300 dark:text-[#1E4029] cursor-not-allowed'}`}>
          Create Task →
        </button>
      </div>
    </aside>
  )
}
