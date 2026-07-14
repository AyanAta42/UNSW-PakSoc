import type { Dispatch, SetStateAction } from 'react'
import type { Member } from '@/members/types/Member'
import { getCatCfg, inputCls, labelCls } from '@/config/categoryConfig'
import { AssignedChip } from '@/tasks/components/assignment/AssignedChip'
import { SubtaskList }  from './SubtaskList'

interface Props {
  title:          string;         setTitle:        Dispatch<SetStateAction<string>>
  cat:            string;         setCat:          Dispatch<SetStateAction<string>>
  allCategories:  string[]
  subtasks:       string[];       setSubtasks:     Dispatch<SetStateAction<string[]>>
  preAssigned:    Member[];       setPreAssigned:  Dispatch<SetStateAction<Member[]>>
  notes:          string;         setNotes:        Dispatch<SetStateAction<string>>
  overForm?:      boolean
  mobileAssignees?: boolean
  onOpenAssigneePicker?: () => void
  onAddTask:      () => void
  submitLabel?:   string
}

export function NewTaskForm({ title, setTitle, cat, setCat, allCategories, subtasks, setSubtasks, preAssigned, setPreAssigned, notes, setNotes, overForm = false, mobileAssignees = false, onOpenAssigneePicker, onAddTask, submitLabel = 'Create Task →' }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className={labelCls}>Task Title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && title.trim() && onAddTask()} placeholder="e.g. Buy equipment" className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Category</label>
        <div className="flex flex-wrap gap-2">
          {allCategories.map(c => {
            const cfg = getCatCfg(c)
            return (
              <button key={c} onClick={() => setCat(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border-[1.5px] cursor-pointer transition-all ${cat === c ? cfg.activeCls : 'bg-gray-50 border-gray-200 text-gray-400'}`}>{c}</button>
            )
          })}
        </div>
      </div>
      <div>
        <label className={labelCls}>Subtasks</label>
        <SubtaskList subtasks={subtasks} setSubtasks={setSubtasks} />
      </div>
      <div>
        <label className={labelCls}>Assignees</label>
        {mobileAssignees ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            {preAssigned.length > 0 && <div className="flex flex-wrap gap-1.5 mb-2">{preAssigned.map(m => <AssignedChip key={m.id} member={m} onRemove={() => setPreAssigned(p => p.filter(a => a.id !== m.id))} />)}</div>}
            <button type="button" onClick={onOpenAssigneePicker} className="w-full py-2.5 rounded-lg text-xs font-bold border border-dashed border-gray-300 bg-white text-gray-500 cursor-pointer active:scale-[0.98] transition-transform">
              {preAssigned.length > 0 ? 'Edit assignees →' : '+ Choose assignees'}
            </button>
          </div>
        ) : (
          <div data-drop-form className={`min-h-[60px] rounded-xl p-2.5 border-2 border-dashed flex flex-wrap gap-1.5 transition-colors ${overForm ? 'border-[#22C55E] bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
            {preAssigned.length === 0
              ? <p className={`w-full text-center text-xs py-2 select-none ${overForm ? 'text-[#22C55E]' : 'text-gray-300'}`}>{overForm ? 'Release to add' : 'Drag or click a member to assign'}</p>
              : preAssigned.map(m => <AssignedChip key={m.id} member={m} onRemove={() => setPreAssigned(p => p.filter(a => a.id !== m.id))} />)
            }
          </div>
        )}
      </div>
      <div>
        <label className={labelCls}>Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional details..." rows={3} className={inputCls + ' resize-y leading-relaxed'} />
      </div>
      <button onClick={onAddTask} disabled={!title.trim()}
        className={`w-full py-3 rounded-xl text-sm font-bold transition-all cursor-pointer border-none ${title.trim() ? 'bg-[#111827] text-white hover:bg-[#374151]' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}>
        {submitLabel}
      </button>
    </div>
  )
}
