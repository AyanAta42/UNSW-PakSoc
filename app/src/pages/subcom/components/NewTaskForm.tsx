import type { Dispatch, SetStateAction } from 'react'
import type { TaskCategory, Member } from '../data/types'
import { CAT_CFG, ALL_CATS, inputCls, labelCls } from '../data/config'
import { AssignedChip } from './AssignedChip'

interface Props {
  title: string;       setTitle:        Dispatch<SetStateAction<string>>
  cat: TaskCategory;   setCat:          Dispatch<SetStateAction<TaskCategory>>
  subtasks: string[];  setSubtasks:     Dispatch<SetStateAction<string[]>>
  preAssigned: Member[]; setPreAssigned: Dispatch<SetStateAction<Member[]>>
  notes: string;       setNotes:        Dispatch<SetStateAction<string>>
  overForm?: boolean
  members?: Member[]
  mobileAssignees?: boolean
  onOpenAssigneePicker?: () => void
  onAddTask: () => void
  submitLabel?: string
}

export function NewTaskForm({
  title, setTitle, cat, setCat, subtasks, setSubtasks, preAssigned, setPreAssigned,
  notes, setNotes, overForm = false, mobileAssignees = false, onOpenAssigneePicker, onAddTask, submitLabel = 'Create Task →',
}: Props) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className={labelCls}>Task Title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && title.trim() && onAddTask()} placeholder="e.g. Buy equipment" className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Category</label>
        <div className="flex gap-2">
          {ALL_CATS.map(c => (
            <button key={c} onClick={() => setCat(c)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold border-[1.5px] cursor-pointer transition-all ${cat === c ? CAT_CFG[c].activeCls : 'bg-gray-50 dark:bg-[#AAFF00]/[.04] border-gray-200 dark:border-[#AAFF00]/[.12] text-gray-400 dark:text-[#2B5C3C]'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelCls}>Subtasks</label>
        <div className="flex flex-col gap-2">
          {subtasks.map((st, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-paksoc-bright shrink-0 dark:shadow-[0_0_4px_#AAFF00]" />
              <input value={st} onChange={e => setSubtasks(p => p.map((s, j) => j === i ? e.target.value : s))} placeholder={`Subtask ${i + 1}`} className={inputCls + ' text-xs'} />
              {subtasks.length > 1 && (
                <button onClick={() => setSubtasks(p => p.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-400 bg-transparent border-none cursor-pointer text-base leading-none transition-colors shrink-0">×</button>
              )}
            </div>
          ))}
        </div>
        <button onClick={() => setSubtasks(p => [...p, ''])} className="mt-2 w-full py-1.5 bg-transparent border border-dashed border-gray-200 dark:border-[#AAFF00]/[.20] rounded-lg text-xs font-semibold text-paksoc-mid dark:text-[#2B5C3C] cursor-pointer hover:border-paksoc-bright dark:hover:border-paksoc-bright dark:hover:text-[#AAFF00] transition-colors">
          + Add subtask
        </button>
      </div>

      <div>
        <label className={labelCls}>Assignees</label>
        {mobileAssignees ? (
          <div className="rounded-xl border border-gray-200 dark:border-[#AAFF00]/[.12] bg-gray-50 dark:bg-[#070C09] p-3">
            {preAssigned.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {preAssigned.map(m => <AssignedChip key={m.id} member={m} onRemove={() => setPreAssigned(p => p.filter(a => a.id !== m.id))} />)}
              </div>
            )}
            <button type="button" onClick={onOpenAssigneePicker}
              className="w-full py-2.5 rounded-lg text-xs font-bold border border-dashed border-gray-300 dark:border-[#AAFF00]/25 bg-white dark:bg-[#0D1610] text-paksoc-mid dark:text-[#AAFF00] cursor-pointer active:scale-[0.98] transition-transform">
              {preAssigned.length > 0 ? 'Edit assignees →' : '+ Choose assignees'}
            </button>
          </div>
        ) : (
          <div
            data-drop-form
            className={`min-h-[60px] rounded-xl p-2.5 border-2 border-dashed flex flex-wrap gap-1.5 ${overForm ? 'border-paksoc-bright bg-paksoc-bright/[.05] dark:shadow-[0_0_20px_rgba(0,255,102,0.1)]' : 'border-gray-200 dark:border-[#AAFF00]/[.12] bg-gray-50 dark:bg-[#070C09]'}`}
          >
            {preAssigned.length === 0
              ? <p className={`w-full text-center text-xs py-2 select-none ${overForm ? 'text-paksoc-bright' : 'text-gray-300 dark:text-[#1E4029]'}`}>{overForm ? 'Release to add' : 'Drag team members here'}</p>
              : preAssigned.map(m => <AssignedChip key={m.id} member={m} onRemove={() => setPreAssigned(p => p.filter(a => a.id !== m.id))} />)
            }
          </div>
        )}
      </div>

      <div>
        <label className={labelCls}>Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional details..." rows={3} className={inputCls + ' resize-y leading-relaxed'} />
      </div>

      <button onClick={onAddTask} disabled={!title.trim()} className={`w-full py-3 rounded-xl text-sm font-bold transition-all cursor-pointer border-none ${title.trim() ? 'bg-paksoc-mid text-white hover:bg-paksoc-deep dark:bg-paksoc-bright dark:text-[#070C09] dark:hover:opacity-90 dark:shadow-[0_0_16px_rgba(0,255,102,0.4)]' : 'bg-gray-100 dark:bg-[#AAFF00]/[.05] text-gray-300 dark:text-[#1E4029] cursor-not-allowed'}`}>
        {submitLabel}
      </button>
    </div>
  )
}
