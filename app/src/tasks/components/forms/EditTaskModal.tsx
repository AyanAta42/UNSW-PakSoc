import { useState } from 'react'
import type { Task } from '@/tasks/types/Task'
import { getCatCfg, inputCls, labelCls } from '@/config/categoryConfig'

interface Props {
  task:          Task
  allCategories: string[]
  onClose:       () => void
  onSave:        (id: string, title: string, cat: string, notes: string, subtasks: string[]) => void
}

export function EditTaskModal({ task, allCategories, onClose, onSave }: Props) {
  const [title, setTitle] = useState(task.title)
  const [cat,   setCat]   = useState(task.category)
  const [notes, setNotes] = useState(task.notes)
  const [subs,  setSubs]  = useState<string[]>(task.subtasks.map(s => s.title).concat(['']))

  function save() {
    if (!title.trim()) return
    onSave(task.id, title.trim(), cat, notes.trim(), subs.filter(s => s.trim()))
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
          <h2 className="text-[#111827] font-extrabold text-base m-0">Edit Task</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl bg-transparent border-none cursor-pointer transition-colors">×</button>
        </div>
        <div className="p-6 flex flex-col gap-4 max-h-[68vh] overflow-y-auto">
          <div><label className={labelCls}>Task Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className={inputCls} /></div>
          <div>
            <label className={labelCls}>Category</label>
            <div className="flex flex-wrap gap-2">
              {allCategories.map(c => {
                const cfg = getCatCfg(c)
                return (
                  <button key={c} onClick={() => setCat(c)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold border-[1.5px] cursor-pointer transition-all ${cat === c ? cfg.activeCls : 'border-gray-200 text-gray-400 bg-transparent hover:border-gray-300'}`}>{c}</button>
                )
              })}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelCls + ' mb-0'}>Subtasks</label>
              <button onClick={() => setSubs(p => [...p, ''])} className="text-[11px] text-[#22C55E] font-bold cursor-pointer bg-transparent border-none">+ Add</button>
            </div>
            <div className="flex flex-col gap-2">
              {subs.map((s, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input value={s} onChange={e => setSubs(p => { const a = [...p]; a[i] = e.target.value; return a })} placeholder={`Subtask ${i + 1}`} className={inputCls + ' flex-1'} />
                  {subs.length > 1 && <button onClick={() => setSubs(p => p.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-400 bg-transparent border-none cursor-pointer text-base leading-none transition-colors">×</button>}
                </div>
              ))}
            </div>
          </div>
          <div><label className={labelCls}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={inputCls + ' resize-none'} placeholder="Additional notes…" /></div>
        </div>
        <div className="px-6 pb-5 flex gap-3 border-t border-gray-100 pt-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-semibold cursor-pointer bg-transparent hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={save} disabled={!title.trim()}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-none cursor-pointer transition-all ${title.trim() ? 'bg-[#111827] text-white hover:bg-[#374151]' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}>Save Changes</button>
        </div>
      </div>
    </div>
  )
}
