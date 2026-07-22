import { useState, useRef } from 'react'
import type { Task } from '@/tasks/types/Task'
import type { Member } from '@/members/types/Member'
import type { KeyboardEvent } from 'react'
import { getCatCfg, inputCls, labelCls } from '@/config/categoryConfig'
import { AssignedChip }      from '@/tasks/components/assignment/AssignedChip'
import { MemberPickerSheet } from '@/tasks/components/assignment/MemberPickerSheet'

interface Props {
  task:          Task
  members:       Member[]
  allCategories: string[]
  mobile?:       boolean
  onClose:       () => void
  onSave:        (id: string, title: string, cat: string, notes: string, subtasks: string[]) => void
  onUnassignMember: (taskId: string, memberId: string) => void
  onApplyAssignees: (taskId: string, memberIds: string[]) => void
}

export function EditTaskModal({ task, members, allCategories, mobile, onClose, onSave, onUnassignMember, onApplyAssignees }: Props) {
  const [title, setTitle] = useState(task.title)
  const [cat,   setCat]   = useState(task.category)
  const [notes, setNotes] = useState(task.notes)
  const [subs,  setSubs]  = useState<string[]>(task.subtasks.map(s => s.title).concat(['']))
  const [pickerOpen, setPickerOpen] = useState(false)
  // Draft assignee selection while the picker is open — nothing is committed (or announced) until Done.
  const [draftAssignees, setDraftAssignees] = useState<string[]>([])
  const subInputs = useRef<(HTMLInputElement | null)[]>([])

  function openPicker() { setDraftAssignees(task.assigned.map(m => m.id)); setPickerOpen(true) }
  function toggleDraft(id: string) { setDraftAssignees(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]) }
  function commitAssignees() { onApplyAssignees(task.id, draftAssignees); setPickerOpen(false) }

  /** Enter adds a new subtask below the current one and focuses it. */
  function subKeyDown(e: KeyboardEvent<HTMLInputElement>, i: number) {
    if (e.key !== 'Enter') return
    e.preventDefault()
    if (!e.currentTarget.value.trim()) return
    setSubs(p => { const a = [...p]; a.splice(i + 1, 0, ''); return a })
    requestAnimationFrame(() => subInputs.current[i + 1]?.focus())
  }

  function save() {
    if (!title.trim()) return
    onSave(task.id, title.trim(), cat, notes.trim(), subs.filter(s => s.trim()))
    onClose()
  }

  return (
    <div className="motion-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="motion-modal bg-[#0D1119] rounded-3xl w-full max-w-lg overflow-hidden border border-[#1D2129]"
        style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 44px 95px -26px rgba(0,0,0,0.75), 0 14px 42px rgba(0,0,0,0.48)' }}
        onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 flex items-center justify-between border-b border-[#1D2129]">
          <h2 className="text-[#F8FAFC] font-extrabold text-base m-0">Edit Task</h2>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#F8FAFC] text-xl bg-transparent border-none cursor-pointer transition-colors">{'×'}</button>
        </div>
        <div className="p-6 flex flex-col gap-4 max-h-[68vh] overflow-y-auto no-scrollbar">
          <div><label className={labelCls}>Task Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className={inputCls} /></div>
          <div>
            <label className={labelCls}>Category</label>
            <div className="flex flex-wrap gap-2">
              {allCategories.map(c => {
                const cfg = getCatCfg(c)
                return (
                  <button key={c} onClick={() => setCat(c)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold border-[1.5px] cursor-pointer transition-all ${cat === c ? cfg.activeCls : 'border-[#1D2129] text-[#64748B] bg-transparent hover:border-[#2E333D]'}`}>{c}</button>
                )
              })}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelCls + ' mb-0'}>Subtasks</label>
              <button onClick={() => setSubs(p => [...p, ''])} className="text-[11px] text-[#4ADE80] font-bold cursor-pointer bg-transparent border-none hover:opacity-80">+ Add</button>
            </div>
            <div className="flex flex-col gap-2">
              {subs.map((s, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input ref={el => { subInputs.current[i] = el }} value={s} onChange={e => setSubs(p => { const a = [...p]; a[i] = e.target.value; return a })} onKeyDown={e => subKeyDown(e, i)} placeholder={`Subtask ${i + 1}`} className={inputCls + ' flex-1'} />
                  {subs.length > 1 && <button onClick={() => setSubs(p => p.filter((_, j) => j !== i))} className="text-[#64748B] hover:text-red-400 bg-transparent border-none cursor-pointer text-base leading-none transition-colors">{'×'}</button>}
                </div>
              ))}
            </div>
          </div>
          {mobile && (
            <div>
              <label className={labelCls}>Assignees</label>
              <div className="rounded-xl border border-[#1D2129] bg-white/[0.03] p-3">
                {task.assigned.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {task.assigned.map(m => <AssignedChip key={m.id} member={m} onRemove={() => onUnassignMember(task.id, m.id)} />)}
                  </div>
                )}
                <button type="button" onClick={openPicker} className="w-full py-2.5 rounded-lg text-xs font-bold border border-dashed border-[#2E333D] bg-transparent text-[#94A3B8] cursor-pointer active:scale-[0.98] transition-transform">
                  {task.assigned.length > 0 ? 'Edit assignees →' : '+ Choose assignees'}
                </button>
              </div>
            </div>
          )}
          <div><label className={labelCls}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={inputCls + ' resize-none'} placeholder="Additional notes…" /></div>
        </div>
        <div className="px-6 pb-5 flex gap-3 border-t border-[#1D2129] pt-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[#1D2129] text-[#CBD5E1] text-sm font-semibold cursor-pointer bg-transparent hover:bg-white/5 transition-colors">Cancel</button>
          <button onClick={save} disabled={!title.trim()}
            style={title.trim() ? { boxShadow: '0 0 20px rgba(34,197,94,0.25)' } : undefined}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-none transition-all ${title.trim() ? 'bg-[#22C55E] text-white hover:bg-[#16A34A] cursor-pointer' : 'bg-white/5 text-[#475569] cursor-not-allowed'}`}>Save Changes</button>
        </div>
        {mobile && pickerOpen && (
          <MemberPickerSheet
            open
            title="Choose assignees"
            members={members}
            multi
            selectedIds={draftAssignees}
            onClose={() => setPickerOpen(false)}
            onPick={m => toggleDraft(m.id)}
            onDone={commitAssignees} />
        )}
      </div>
    </div>
  )
}
