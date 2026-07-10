import type { Dispatch, SetStateAction } from 'react'
import type { TaskCategory } from '@/tasks/types/Task'
import type { Member } from '@/members/types/Member'
import { NewTaskForm } from '@/tasks/components/forms/NewTaskForm'

interface Props {
  title: string;        setTitle:        Dispatch<SetStateAction<string>>
  cat: TaskCategory;    setCat:          Dispatch<SetStateAction<TaskCategory>>
  subtasks: string[];   setSubtasks:     Dispatch<SetStateAction<string[]>>
  preAssigned: Member[]; setPreAssigned: Dispatch<SetStateAction<Member[]>>
  notes: string;        setNotes:        Dispatch<SetStateAction<string>>
  overForm: boolean
  onAddTask: () => void
}

/** Right-side panel (desktop only) containing the new-task creation form. */
export function NewTaskPanel({ title, setTitle, cat, setCat, subtasks, setSubtasks, preAssigned, setPreAssigned, notes, setNotes, overForm, onAddTask }: Props) {
  return (
    <aside className="hidden lg:flex w-[310px] shrink-0 flex-col overflow-hidden bg-white dark:bg-[#0D1610] border-l border-gray-200 dark:border-[#AAFF00]/[.10]">
      <div className="p-5 border-b border-gray-200 dark:border-[#AAFF00]/[.10] shrink-0">
        <div className="text-[15px] font-extrabold text-paksoc-deep dark:text-[#D4FAE3]">+ New Task</div>
        <div className="text-xs text-gray-400 dark:text-[#2B5C3C] mt-1">Fill in details below</div>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        <NewTaskForm title={title} setTitle={setTitle} cat={cat} setCat={setCat} subtasks={subtasks} setSubtasks={setSubtasks} preAssigned={preAssigned} setPreAssigned={setPreAssigned} notes={notes} setNotes={setNotes} overForm={overForm} onAddTask={onAddTask} />
      </div>
    </aside>
  )
}
