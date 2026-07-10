import { useState } from 'react'
import type { Task, TaskCategory } from '@/tasks/types/Task'
import { ALL_CATS, CAT_CFG, inputCls, labelCls } from '@/config/categoryConfig'

interface Props {
  task:    Task
  dark:    boolean
  onClose: () => void
  onSave:  (id: string, title: string, cat: TaskCategory, notes: string, subtasks: string[]) => void
}

export function EditTaskModal({ task, dark, onClose, onSave }: Props) {
  const [title, setTitle] = useState(task.title)
  const [cat, setCat]     = useState<TaskCategory>(task.category)
  const [notes, setNotes] = useState(task.notes)
  const [subs, setSubs]   = useState<string[]>(task.subtasks.map(s => s.title).concat(['']))

  function save() {
    if (!title.trim()) return
    onSave(task.id, title.trim(), cat, notes.trim(), subs.filter(s => s.trim()))
    onClose()
  }

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-white dark:bg-[#0D1610] rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-gray-100 dark:border-[#AAFF00]/[.15]" onClick={e => e.stopPropagation()}>
          <div className="bg-gradient-to-r from-paksoc-deep to-paksoc-mid dark:from-[#0A1209] dark:to-[#001A0A] px-6 py-4 flex items-center justify-between">
            <h2 className="text-white font-extrabold text-[16px] m-0">Edit Task</h2>
            <button onClick={onClose} className="text-white/70 hover:text-white text-xl bg-transparent border-none cursor-pointer">×</button>
          </div>
          <div className="p-6 flex flex-col gap-4 max-h-[68vh] overflow-y-auto">
            <div><label className={labelCls}>Task Title</label><input value={title} onChange={e => setTitle(e.target.value)} className={inputCls} /></div>
            <div>
              <label className={labelCls}>Category</label>
              <div className="flex gap-2">
                {ALL_CATS.map(c => (
                  <button key={c} onClick={() => setCat(c)} className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 cursor-pointer transition-all ${cat === c ? CAT_CFG[c].activeCls : 'border-gray-200 dark:border-[#AAFF00]/[.15] text-gray-400 dark:text-[#2B5C3C] bg-transparent'}`}>{c}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelCls + ' mb-0'}>Subtasks</label>
                <button onClick={() => setSubs(p => [...p, ''])} className="text-[11px] text-paksoc-mid dark:text-[#AAFF00] font-bold cursor-pointer bg-transparent border-none">+ Add</button>
              </div>
              <div className="flex flex-col gap-2">
                {subs.map((s, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input value={s} onChange={e => setSubs(p => { const a = [...p]; a[i] = e.target.value; return a })} placeholder={`Subtask ${i + 1}`} className={inputCls + ' flex-1'} />
                    {subs.length > 1 && <button onClick={() => setSubs(p => p.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-400 bg-transparent border-none cursor-pointer text-base leading-none">×</button>}
                  </div>
                ))}
              </div>
            </div>
            <div><label className={labelCls}>Notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={inputCls + ' resize-none'} placeholder="Additional notes…" /></div>
          </div>
          <div className="px-6 pb-5 flex gap-3 border-t border-gray-100 dark:border-[#AAFF00]/[.08] pt-4">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-[#AAFF00]/[.15] text-gray-500 dark:text-[#2B5C3C] text-sm font-semibold cursor-pointer bg-transparent hover:bg-gray-50 dark:hover:bg-[#0A1209] transition-colors">Cancel</button>
            <button onClick={save} disabled={!title.trim()} className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-none cursor-pointer transition-all ${title.trim() ? 'bg-paksoc-mid text-white hover:bg-paksoc-deep dark:bg-[#AAFF00] dark:text-[#070C09]' : 'bg-gray-100 dark:bg-[#0D1610] text-gray-300 cursor-not-allowed'}`}>Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  )
}
