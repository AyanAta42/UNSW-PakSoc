import { useRef } from 'react'
import type { Dispatch, SetStateAction, KeyboardEvent } from 'react'
import { inputCls } from '@/config/categoryConfig'

interface Props {
  subtasks:    string[]
  setSubtasks: Dispatch<SetStateAction<string[]>>
}

/** Editable list of subtask text inputs with add/remove controls. */
export function SubtaskList({ subtasks, setSubtasks }: Props) {
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  /** Enter adds a new subtask below the current one and focuses it. */
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>, i: number) {
    if (e.key !== 'Enter') return
    e.preventDefault()
    if (!e.currentTarget.value.trim()) return
    setSubtasks(p => { const a = [...p]; a.splice(i + 1, 0, ''); return a })
    requestAnimationFrame(() => inputs.current[i + 1]?.focus())
  }

  return (
    <div className="flex flex-col gap-2">
      {subtasks.map((st, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-[5px] border-[1.5px] border-[#2E333D] shrink-0" />
          <input
            ref={el => { inputs.current[i] = el }}
            value={st}
            onChange={e => setSubtasks(p => p.map((s, j) => j === i ? e.target.value : s))}
            onKeyDown={e => handleKeyDown(e, i)}
            placeholder={`Subtask ${i + 1}`}
            className={inputCls + ' text-xs'}
          />
          {subtasks.length > 1 && (
            <button onClick={() => setSubtasks(p => p.filter((_, j) => j !== i))}
              className="text-[#64748B] hover:text-red-400 bg-transparent border-none cursor-pointer text-base leading-none transition-colors shrink-0">{'×'}</button>
          )}
        </div>
      ))}
      <button onClick={() => setSubtasks(p => [...p, ''])}
        className="mt-2 w-full py-1.5 bg-transparent border border-dashed border-[#2E333D] rounded-lg text-xs font-semibold text-[#94A3B8] cursor-pointer hover:border-[#22C55E] hover:text-[#4ADE80] transition-colors">
        + Add subtask
      </button>
    </div>
  )
}
