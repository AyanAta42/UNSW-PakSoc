import type { Dispatch, SetStateAction } from 'react'
import type { TaskCategory } from '@/tasks/types/Task'
import type { Member } from '@/members/types/Member'
import { NewTaskForm } from './NewTaskForm'

interface Props {
  open: boolean; onClose: () => void
  title: string;        setTitle:        Dispatch<SetStateAction<string>>
  cat: TaskCategory;    setCat:          Dispatch<SetStateAction<TaskCategory>>
  subtasks: string[];   setSubtasks:     Dispatch<SetStateAction<string[]>>
  preAssigned: Member[]; setPreAssigned: Dispatch<SetStateAction<Member[]>>
  notes: string;        setNotes:        Dispatch<SetStateAction<string>>
  onAddTask: () => void
  onOpenAssigneePicker: () => void
}

/** Mobile bottom-sheet wrapper for the new-task form. */
export function NewTaskModal({ open, onClose, title, setTitle, cat, setCat, subtasks, setSubtasks, preAssigned, setPreAssigned, notes, setNotes, onAddTask, onOpenAssigneePicker }: Props) {
  if (!open) return null

  function handleCreate() {
    if (!title.trim()) return
    onAddTask(); onClose()
  }

  return (
    <div className="fixed inset-0 z-[70] lg:hidden">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 rounded-t-[28px] max-h-[92vh] flex flex-col bg-white dark:bg-[#0D1610] shadow-[0_-8px_40px_rgba(0,0,0,0.18)] animate-[slideUp_0.28s_ease-out]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1 shrink-0"><div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-[#AAFF00]/20" /></div>
        <div className="flex items-center justify-between px-5 pb-3 shrink-0">
          <div>
            <div className="text-[15px] font-extrabold text-paksoc-deep dark:text-[#D4FAE3]">New Task</div>
            <div className="text-xs text-gray-400 dark:text-[#2B5C3C] mt-0.5">Fill in details below</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full border border-gray-200 dark:border-[#AAFF00]/20 bg-white dark:bg-[#0D1610] flex items-center justify-center text-lg leading-none cursor-pointer text-gray-400">×</button>
        </div>
        <div className="overflow-y-auto px-5 pb-8">
          <NewTaskForm title={title} setTitle={setTitle} cat={cat} setCat={setCat} subtasks={subtasks} setSubtasks={setSubtasks} preAssigned={preAssigned} setPreAssigned={setPreAssigned} notes={notes} setNotes={setNotes} mobileAssignees onOpenAssigneePicker={onOpenAssigneePicker} onAddTask={handleCreate} />
        </div>
      </div>
    </div>
  )
}
