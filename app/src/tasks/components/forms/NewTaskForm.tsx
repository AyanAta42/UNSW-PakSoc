import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { Member } from '@/members/types/Member'
import { getCatCfg, inputCls, labelCls } from '@/config/categoryConfig'
import { DEFAULT_TASK_CATEGORIES } from '@/tasks/types/Task'
import { AssignedChip }  from '@/tasks/components/assignment/AssignedChip'
import { SubtaskList }   from './SubtaskList'
import { ConfirmModal }  from '@/shared/components/ConfirmModal'

interface Props {
  title:          string;         setTitle:        Dispatch<SetStateAction<string>>
  cat:            string;         setCat:          Dispatch<SetStateAction<string>>
  allCategories:  string[]
  onAddCategory?:    (name: string) => void
  onRemoveCategory?: (name: string) => void
  subtasks:       string[];       setSubtasks:     Dispatch<SetStateAction<string[]>>
  preAssigned:    Member[];       setPreAssigned:  Dispatch<SetStateAction<Member[]>>
  notes:          string;         setNotes:        Dispatch<SetStateAction<string>>
  overForm?:      boolean
  mobileAssignees?: boolean
  onOpenAssigneePicker?: () => void
  onAddTask:      () => void
  submitLabel?:   string
}

export function NewTaskForm({ title, setTitle, cat, setCat, allCategories, onAddCategory, onRemoveCategory, subtasks, setSubtasks, preAssigned, setPreAssigned, notes, setNotes, overForm = false, mobileAssignees = false, onOpenAssigneePicker, onAddTask, submitLabel = 'Create Task â†’' }: Props) {
  const [showAddCat,      setShowAddCat]      = useState(false)
  const [catInput,        setCatInput]        = useState('')
  const [pendingDeleteCat, setPendingDeleteCat] = useState<string | null>(null)

  function submitCategory() {
    const v = catInput.trim()
    if (!v || !onAddCategory || allCategories.includes(v)) return
    onAddCategory(v)
    setCat(v)           // auto-select the new category
    setCatInput('')
    setShowAddCat(false)
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className={labelCls}>Task Title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && title.trim() && onAddTask()} placeholder="e.g. Buy equipment" className={inputCls} />
      </div>
      <div>
        <div className="flex items-center mb-1.5">
          <label className={labelCls + ' mb-0 flex-1'}>Category</label>
          {onAddCategory && (
            <button type="button" onClick={() => { setShowAddCat(v => !v); setCatInput('') }}
              aria-label={showAddCat ? 'Close category manager' : 'Add custom category'}
              className={`w-6 h-6 rounded-full border-none flex items-center justify-center text-sm font-bold leading-none cursor-pointer transition-all shrink-0 ${showAddCat ? 'bg-white/10 text-[#94A3B8] hover:bg-white/15' : 'bg-[#22C55E] text-white hover:bg-[#16A34A]'}`}>
              {showAddCat ? '×' : '+'}
            </button>
          )}
        </div>
        {showAddCat && onAddCategory && (
          <div className="flex gap-2 mb-2.5">
            <input value={catInput} onChange={e => setCatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitCategory()}
              placeholder="New category nameâ€¦" autoFocus
              className="flex-1 px-3 py-1.5 border border-[#1D2129] rounded-lg bg-[#090C13] text-[#F8FAFC] placeholder:text-[#475569] text-sm outline-none focus:border-[#22C55E] transition-colors" />
            <button type="button" onClick={submitCategory} disabled={!catInput.trim()}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border-none shrink-0 transition-colors ${catInput.trim() ? 'bg-[#22C55E] text-white hover:bg-[#16A34A] cursor-pointer' : 'bg-white/5 text-[#475569] cursor-not-allowed'}`}>Add</button>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {allCategories.map(c => {
            const cfg = getCatCfg(c)
            const isCustom = !DEFAULT_TASK_CATEGORIES.includes(c)
            return (
              <button key={c} type="button" onClick={() => setCat(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border-[1.5px] cursor-pointer transition-all flex items-center gap-1 ${cat === c ? cfg.activeCls : 'bg-white/[0.03] border-[#1D2129] text-[#64748B] hover:border-[#2E333D]'}`}>
                {c}
                {isCustom && showAddCat && onRemoveCategory && (
                  <span role="button" tabIndex={0}
                    onClick={e => { e.stopPropagation(); setPendingDeleteCat(c) }}
                    onKeyDown={e => e.key === 'Enter' && (e.stopPropagation(), setPendingDeleteCat(c))}
                    className="w-3.5 h-3.5 flex items-center justify-center rounded-full bg-red-500/15 text-red-400 hover:bg-red-500/25 hover:text-red-300 text-[9px] leading-none ml-0.5 transition-colors">{'×'}</span>
                )}
              </button>
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
          <div className="rounded-xl border border-[#1D2129] bg-white/[0.03] p-3">
            {preAssigned.length > 0 && <div className="flex flex-wrap gap-1.5 mb-2">{preAssigned.map(m => <AssignedChip key={m.id} member={m} onRemove={() => setPreAssigned(p => p.filter(a => a.id !== m.id))} />)}</div>}
            <button type="button" onClick={onOpenAssigneePicker} className="w-full py-2.5 rounded-lg text-xs font-bold border border-dashed border-[#2E333D] bg-transparent text-[#94A3B8] cursor-pointer active:scale-[0.98] transition-transform">
              {preAssigned.length > 0 ? 'Edit assignees â†’' : '+ Choose assignees'}
            </button>
          </div>
        ) : (
          <div data-drop-form className={`min-h-[60px] rounded-xl p-2.5 border-2 border-dashed flex flex-wrap gap-1.5 transition-colors ${overForm ? 'border-[#22C55E] bg-green-500/10' : 'border-[#2E333D] bg-white/[0.03]'}`}>
            {preAssigned.length === 0
              ? <p className={`w-full text-center text-xs py-2 select-none ${overForm ? 'text-[#4ADE80]' : 'text-[#64748B]'}`}>{overForm ? 'Release to add' : 'Drag or click a member to assign'}</p>
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
        style={title.trim() ? { boxShadow: '0 0 20px rgba(34,197,94,0.25)' } : undefined}
        className={`w-full py-3 rounded-xl text-sm font-bold transition-all border-none ${title.trim() ? 'bg-[#22C55E] text-white hover:bg-[#16A34A] cursor-pointer' : 'bg-white/5 text-[#475569] cursor-not-allowed'}`}>
        {submitLabel}
      </button>

      {pendingDeleteCat && onRemoveCategory && (
        <ConfirmModal
          title={`Delete "${pendingDeleteCat}" category?`}
          message="The category will be removed from this event."
          warning="All tasks in this category will be permanently deleted and cannot be recovered."
          confirmLabel="Delete Category & Tasks"
          danger
          onConfirm={() => { onRemoveCategory(pendingDeleteCat); setPendingDeleteCat(null) }}
          onCancel={() => setPendingDeleteCat(null)}
        />
      )}
    </div>
  )
}
