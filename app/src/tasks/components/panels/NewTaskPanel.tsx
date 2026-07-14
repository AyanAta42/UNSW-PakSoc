import type { Dispatch, SetStateAction } from 'react'
import type { Member } from '@/members/types/Member'
import { NewTaskForm } from '@/tasks/components/forms/NewTaskForm'

interface Props {
  title:         string;        setTitle:       Dispatch<SetStateAction<string>>
  cat:           string;        setCat:         Dispatch<SetStateAction<string>>
  allCategories: string[]
  subtasks:      string[];      setSubtasks:    Dispatch<SetStateAction<string[]>>
  preAssigned:   Member[];      setPreAssigned: Dispatch<SetStateAction<Member[]>>
  notes:         string;        setNotes:       Dispatch<SetStateAction<string>>
  overForm:      boolean
  onAddTask:     () => void
}

export function NewTaskPanel({ title, setTitle, cat, setCat, allCategories, subtasks, setSubtasks, preAssigned, setPreAssigned, notes, setNotes, overForm, onAddTask }: Props) {
  return (
    <aside className="hidden lg:flex w-[300px] shrink-0 flex-col overflow-hidden bg-white border-l border-gray-200">
      <div className="p-5 border-b border-gray-200 shrink-0">
        <div className="text-[15px] font-extrabold text-[#111827]">+ New Task</div>
        <div className="text-xs text-gray-400 mt-1">Fill in details and hit Create</div>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        <NewTaskForm title={title} setTitle={setTitle} cat={cat} setCat={setCat} allCategories={allCategories}
          subtasks={subtasks} setSubtasks={setSubtasks} preAssigned={preAssigned} setPreAssigned={setPreAssigned}
          notes={notes} setNotes={setNotes} overForm={overForm} onAddTask={onAddTask} />
      </div>
    </aside>
  )
}
