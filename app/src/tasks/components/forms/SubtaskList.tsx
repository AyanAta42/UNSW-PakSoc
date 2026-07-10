import type { Dispatch, SetStateAction } from 'react'
import { inputCls } from '@/config/categoryConfig'

interface Props {
  subtasks:    string[]
  setSubtasks: Dispatch<SetStateAction<string[]>>
}

/** Editable list of subtask text inputs with add/remove controls. */
export function SubtaskList({ subtasks, setSubtasks }: Props) {
  return (
    <div className="flex flex-col gap-2">
      {subtasks.map((st, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-paksoc-bright shrink-0 dark:shadow-[0_0_4px_#AAFF00]" />
          <input
            value={st}
            onChange={e => setSubtasks(p => p.map((s, j) => j === i ? e.target.value : s))}
            placeholder={`Subtask ${i + 1}`}
            className={inputCls + ' text-xs'}
          />
          {subtasks.length > 1 && (
            <button onClick={() => setSubtasks(p => p.filter((_, j) => j !== i))}
              className="text-gray-300 hover:text-red-400 bg-transparent border-none cursor-pointer text-base leading-none transition-colors shrink-0">×</button>
          )}
        </div>
      ))}
      <button onClick={() => setSubtasks(p => [...p, ''])}
        className="mt-2 w-full py-1.5 bg-transparent border border-dashed border-gray-200 dark:border-[#AAFF00]/[.20] rounded-lg text-xs font-semibold text-paksoc-mid dark:text-[#2B5C3C] cursor-pointer hover:border-paksoc-bright dark:hover:border-paksoc-bright dark:hover:text-[#AAFF00] transition-colors">
        + Add subtask
      </button>
    </div>
  )
}
